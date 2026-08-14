import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Kopargaon Municipal Center Coordinates
const KOPARGAON_CENTER = [19.8887, 74.4784];

// Helper to safely parse coordinates
const parseCoordinate = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(val);
  return Number.isFinite(num) ? num : null;
};

// Helper to generate dynamic colored pin based on Trust Index Score
const createCustomIcon = (trustIndex) => {
  let color = '#10B981'; // Green for high trust (>= 80)
  if (trustIndex < 60) {
    color = '#EF4444'; // Red for low trust (< 60)
  } else if (trustIndex < 80) {
    color = '#B8791A'; // Amber/Yellow for medium trust (60 - 79)
  }

  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36" height="36" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgMarker,
    className: 'custom-leaflet-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

export default function ProjectMap({ projects = [], onSelectProject }) {
  return (
    <div className="w-full h-[520px] rounded-2xl overflow-hidden shadow-sm border border-[var(--border,#e5e7eb)] relative z-0">
      {/* Map Trust Index Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-md border border-gray-100 text-xs flex flex-col gap-1.5">
        <span className="font-semibold text-gray-800 mb-0.5">Trust Index Legend</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-gray-600">High Trust (80 - 100)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-600 inline-block"></span>
          <span className="text-gray-600">Medium Trust (60 - 79)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
          <span className="text-gray-600">Low Trust / Flagged (&lt; 60)</span>
        </div>
      </div>

      <MapContainer
        center={KOPARGAON_CENTER}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {projects.map((project, idx) => {
          const projectTitle = project.name || project.title || 'Infrastructure Project';
          const rawTrust = project.trustScore ?? project.trust_index ?? project.trustIndex ?? 100;
          const trustIndex = Number.isFinite(parseFloat(rawTrust)) ? parseFloat(rawTrust) : 100;
          const budgetTotal = project.budget_total ?? project.budget ?? 0;
          const wardName = project.ward || 'Kopargaon Ward';
          const contractorName = project.contractor_name || 'Assigned Contractor';

          let lat = parseCoordinate(project.latitude);
          let lng = parseCoordinate(project.longitude);

          // If coordinates are missing OR if they match default Kopargaon center,
          // apply a spiral spread so overlapping pins don't stack on top of each other!
          const isDefault =
            !lat ||
            !lng ||
            (Math.abs(lat - KOPARGAON_CENTER[0]) < 0.0001 && Math.abs(lng - KOPARGAON_CENTER[1]) < 0.0001);

          if (isDefault) {
            const angle = idx * 1.8; // Spread angle around the circle
            const radius = 0.006 + idx * 0.003; // Radius offset
            lat = KOPARGAON_CENTER[0] + Math.sin(angle) * radius;
            lng = KOPARGAON_CENTER[1] + Math.cos(angle) * radius;
          }

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null;
          }

          return (
            <Marker
              key={project.id || idx}
              position={[lat, lng]}
              icon={createCustomIcon(trustIndex)}
            >
              <Popup>
                <div className="p-1 min-w-[210px] text-left">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{projectTitle}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold text-white shrink-0 ${
                        trustIndex >= 80
                          ? 'bg-emerald-600'
                          : trustIndex >= 60
                          ? 'bg-amber-600'
                          : 'bg-red-600'
                      }`}
                    >
                      {trustIndex}
                    </span>
                  </div>

                  <p className="text-xs text-indigo-600 font-semibold mb-2 uppercase tracking-wide">
                    {wardName}
                  </p>

                  <div className="text-xs space-y-1 mb-3 text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-500">Budget:</span>
                      <span className="font-semibold text-gray-800">
                        ₹{Number(budgetTotal).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-500">Contractor:</span>
                      <span className="font-semibold text-gray-800 line-clamp-1">{contractorName}</span>
                    </div>
                  </div>

                  {onSelectProject && (
                    <button
                      type="button"
                      onClick={() => onSelectProject(project.id)}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors text-center block"
                    >
                      View Project Passport →
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}