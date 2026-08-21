import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Kopargaon Municipal Center Coordinates
const KOPARGAON_CENTER = [19.8887, 74.4784];

// Helper component to trigger map resize recalculation on view switch
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

const parseCoordinate = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(val);
  return Number.isFinite(num) ? num : null;
};

// Helper to generate dynamic colored pin based on Trust Index Score
const createCustomIcon = (trustIndex) => {
  let color = '#10B981'; // Emerald Green for high trust (>= 80)
  if (trustIndex < 60) {
    color = '#EF4444'; // Red for low trust (< 60)
  } else if (trustIndex < 80) {
    color = '#B8791A'; // Amber for medium trust (60 - 79)
  }

  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="34" height="34" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgMarker,
    className: 'custom-leaflet-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

export default function ProjectMap({ projects = [], onSelectProject }) {
  return (
    <div className="w-full h-[410px] sm:h-[430px] lg:h-[calc(100vh-270px)] min-h-[350px] max-h-[470px] rounded-2xl overflow-hidden shadow-2xs border border-slate-200 relative z-0">
      {/* Map Trust Index Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-md border border-slate-100 text-xs flex flex-col gap-1">
        <span className="font-bold text-slate-800 text-[11px] mb-0.5">Trust Index Legend</span>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-[11px] text-slate-600 font-medium">High Trust (80 - 100)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
          <span className="text-[11px] text-slate-600 font-medium">Medium Trust (60 - 79)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
          <span className="text-[11px] text-slate-600 font-medium">Low Trust / Flagged (&lt; 60)</span>
        </div>
      </div>

      <MapContainer
        center={KOPARGAON_CENTER}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapResizer />
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

          // Spiral offset algorithm for default/overlapping coordinates
          const isDefault =
            !lat ||
            !lng ||
            (Math.abs(lat - KOPARGAON_CENTER[0]) < 0.0001 && Math.abs(lng - KOPARGAON_CENTER[1]) < 0.0001);

          if (isDefault) {
            const angle = idx * 1.8;
            const radius = 0.006 + idx * 0.003;
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
                <div className="p-1 min-w-[200px] text-left">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-xs leading-tight">{projectTitle}</h3>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold text-white shrink-0 ${
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

                  <p className="text-[10px] text-teal-700 font-bold mb-1.5 uppercase tracking-wider">
                    {wardName}
                  </p>

                  <div className="text-[11px] space-y-1 mb-2.5 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-400">Budget:</span>
                      <span className="font-bold text-slate-800">
                        ₹{Number(budgetTotal).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-400">Contractor:</span>
                      <span className="font-semibold text-slate-800 line-clamp-1">{contractorName}</span>
                    </div>
                  </div>

                  {onSelectProject && (
                    <button
                      type="button"
                      onClick={() => onSelectProject(project.id)}
                      className="w-full py-1 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg transition-colors text-center block shadow-2xs"
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