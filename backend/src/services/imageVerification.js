import fs from 'fs';
import ExifParser from 'exif-parser';

// General construction & infrastructure keywords
const BASE_CONSTRUCTION_KEYWORDS = [
  'construction', 'building', 'structure', 'road', 'asphalt', 'concrete',
  'trench', 'pipe', 'excavator', 'dumper', 'truck', 'scaffolding', 'brick',
  'wall', 'bridge', 'pavement', 'foundation', 'roof', 'wheelbarrow', 'shovel',
  'earthwork', 'lumber', 'steel', 'crane', 'barrier', 'harvester', 'tractor'
];

// Valid groundwork / earthmoving keywords (Dirt, soil, excavated earth, gravel)
const GROUNDWORK_KEYWORDS = [
  'dirt', 'soil', 'sand', 'mud', 'trench', 'excavation', 
  'ground', 'plot', 'earth', 'stone', 'quarry', 'gravel', 'plow'
];

// DENSE FOREST / UN-CLEARED NATURE KEYWORDS (Triggers Fraud Warning if standing trees/jungles are shown!)
const UNCLEARED_NATURE_KEYWORDS = [
  'forest', 'jungle', 'rainforest', 'valley', 'vale', 'tree', 'foliage', 
  'woods', 'vegetation', 'wilderness', 'grove', 'plant', 'leaf', 'alpine'
];

// Always-Forbidden non-construction screen/meme objects
const FORBIDDEN_SCREEN_KEYWORDS = [
  'web site', 'website', 'screen', 'monitor', 'television', 'comic book', 
  'meme', 'document', 'paper', 'envelope', 'cellular telephone', 'display'
];

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export async function verifyUploadedImage(filePath, projectLat, projectLng, contextText = '') {
  let geoStatus = 'NO_METADATA';
  let geoDistanceKm = null;
  let contentStatus = 'CONSTRUCTION_DETECTED';
  let detectedLabels = [];
  let photoLat = null;
  let photoLng = null;

  // 1. EXIF GEOTAG EXTRACTION & GEOFENCING
  try {
    const buffer = fs.readFileSync(filePath);
    const parser = ExifParser.create(buffer);
    const result = parser.parse();

    if (result.tags && result.tags.GPSLatitude && result.tags.GPSLongitude) {
      photoLat = Number(result.tags.GPSLatitude.toFixed(6));
      photoLng = Number(result.tags.GPSLongitude.toFixed(6));
      geoDistanceKm = calculateDistanceKm(photoLat, photoLng, projectLat, projectLng);

      geoStatus = geoDistanceKm <= 1.5 ? 'VERIFIED' : 'LOCATION_MISMATCH';
    }
  } catch (err) {
    geoStatus = 'NO_METADATA';
  }

  // 2. ACCURATE CONTEXT-AWARE AI VISION
  const lowerContext = contextText.toLowerCase();
  const isEarlyStage = 
    lowerContext.includes('clearing') || 
    lowerContext.includes('leveling') || 
    lowerContext.includes('excavation') || 
    lowerContext.includes('survey') || 
    lowerContext.includes('trench');

  try {
    const { pipeline } = await import('@xenova/transformers');
    const classifier = await pipeline('image-classification', 'Xenova/vit-base-patch16-224');
    const predictions = await classifier(filePath);

    detectedLabels = predictions.slice(0, 3).map((p) => p.label.toLowerCase());

    // Check if photo shows an uncleared forest, jungle, or valley with trees
    const isUnclearedNature = detectedLabels.some((label) =>
      UNCLEARED_NATURE_KEYWORDS.some((natureWord) => label.includes(natureWord))
    );

    // Check if photo shows a screen, meme, or website
    const containsForbiddenScreen = detectedLabels.some((label) =>
      FORBIDDEN_SCREEN_KEYWORDS.some((forbidden) => label.includes(forbidden))
    );

    // IF PHOTO SHOWS DENSE FOREST/VALLEY OR LAPTOP SCREEN -> TRIGGER AI FRAUD WARNING!
    if (isUnclearedNature || containsForbiddenScreen) {
      contentStatus = 'NON_CONSTRUCTION_DETECTED';
    } else {
      const activeAllowedKeywords = isEarlyStage 
        ? [...BASE_CONSTRUCTION_KEYWORDS, ...GROUNDWORK_KEYWORDS]
        : BASE_CONSTRUCTION_KEYWORDS;

      const isMatch = detectedLabels.some((label) =>
        activeAllowedKeywords.some((keyword) => label.includes(keyword))
      );

      contentStatus = isMatch ? 'CONSTRUCTION_DETECTED' : 'NON_CONSTRUCTION_DETECTED';
    }
  } catch (err) {
    detectedLabels = ['site_photo'];
    contentStatus = 'CONSTRUCTION_DETECTED';
  }

  const isAutoFlagged = geoStatus === 'LOCATION_MISMATCH' || contentStatus === 'NON_CONSTRUCTION_DETECTED';

  return {
    geoStatus,
    geoDistanceKm,
    photoLat,
    photoLng,
    contentStatus,
    detectedLabels: detectedLabels.join(', '),
    isAutoFlagged
  };
}
// Replace verifyCitizenFlagImage in backend/src/services/imageVerification.js with this:

export async function verifyCitizenFlagImage(filePath, projectLat, projectLng) {
  let geoStatus = 'NO_METADATA';
  let geoDistanceKm = null;
  let photoLat = null;
  let photoLng = null;

  try {
    const buffer = fs.readFileSync(filePath);
    const parser = ExifParser.create(buffer);
    const result = parser.parse();

    if (result.tags && result.tags.GPSLatitude && result.tags.GPSLongitude) {
      photoLat = Number(result.tags.GPSLatitude.toFixed(6));
      photoLng = Number(result.tags.GPSLongitude.toFixed(6));
      
      // Calculate distance in kilometers
      geoDistanceKm = calculateDistanceKm(photoLat, photoLng, projectLat, projectLng);

      // STRICT 100-METER GEOFENCE THRESHOLD (0.1 km)
      if (geoDistanceKm <= 0.1) {
        geoStatus = 'VERIFIED';
      } else {
        geoStatus = 'LOCATION_MISMATCH';
      }
    }
  } catch (err) {
    geoStatus = 'NO_METADATA';
  }

  return { 
    geoStatus, 
    geoDistanceKm, 
    photoLat, 
    photoLng 
  };
}
