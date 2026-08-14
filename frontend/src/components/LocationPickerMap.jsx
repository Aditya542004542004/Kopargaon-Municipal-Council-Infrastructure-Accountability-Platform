import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const KOPARGAON_CENTER = [19.8887, 74.4784];

// Pin icon for location picker
const customIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4f46e5" width="32" height="32" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `,
  className: 'custom-picker-pin',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Helper component to handle map clicks
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6))
      });
    }
  });
  return null;
}

export default function LocationPickerMap({ location, onChangeLocation }) {
  const currentPos = location?.lat && location?.lng 
    ? [location.lat, location.lng] 
    : KOPARGAON_CENTER;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs text-gray-500 font-semibold uppercase tracking-wide">
        <span>PROJECT LOCATION ON MAP (Click to place pin)</span>
        {location?.lat && (
          <span className="text-indigo-600 font-mono">
            {location.lat}, {location.lng}
          </span>
        )}
      </div>

      <div className="h-44 w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner relative z-0">
        <MapContainer
          center={currentPos}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={onChangeLocation} />
          {location?.lat && location?.lng && (
            <Marker position={[location.lat, location.lng]} icon={customIcon} />
          )}
        </MapContainer>
      </div>
      <p className="text-[11px] text-gray-400">
        * Click anywhere on the map of Kopargaon to set the exact project site.
      </p>
    </div>
  );
}