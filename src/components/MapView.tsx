import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Place } from '../types';
import { Navigation, Star, MapPin, ExternalLink, MessageCircle } from 'lucide-react';

// Custom Marker Icons
const createCustomIcon = (isSelected: boolean, category?: string) => {
  const iconColor = isSelected ? '#ea580c' : '#f97316';
  const size = isSelected ? 42 : 34;

  const svgHtml = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${iconColor}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
        <circle cx="12" cy="9" r="3" fill="#ffffff"></circle>
      </svg>
      <div style="position: absolute; top: ${size * 0.23}px; font-size: ${size * 0.28}px;">🍲</div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: isSelected ? 'custom-marker-active' : '',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -size],
  });
};

// Selection marker for adding new places
const selectionIcon = L.divIcon({
  html: `
    <div style="transform: translate(-50%, -100%);">
      <div style="background-color: #2563eb; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #ffffff;">
        <span style="transform: rotate(45deg); font-size: 16px; color: white;">📍</span>
      </div>
    </div>
  `,
  className: '',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

// Component to handle smooth flyTo when selectedPlace changes
function MapFlyController({
  selectedPlace,
  centerPosition,
}: {
  selectedPlace: Place | null;
  centerPosition?: { lat: number; lng: number; zoom?: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace) {
      map.flyTo([selectedPlace.latitude, selectedPlace.longitude], 16, {
        duration: 1.2,
      });
    } else if (centerPosition) {
      map.flyTo([centerPosition.lat, centerPosition.lng], centerPosition.zoom || 13, {
        duration: 1.0,
      });
    }
  }, [selectedPlace, centerPosition, map]);

  return null;
}

// Map Click Listener for choosing location
function MapClickHandler({
  isPickingLocation,
  onLocationPicked,
}: {
  isPickingLocation: boolean;
  onLocationPicked?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (isPickingLocation && onLocationPicked) {
        onLocationPicked(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place | null) => void;
  centerPosition?: { lat: number; lng: number; zoom?: number } | null;
  isPickingLocation?: boolean;
  pickedPosition?: { lat: number; lng: number } | null;
  onLocationPicked?: (lat: number, lng: number) => void;
  seniorMode: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  centerPosition,
  isPickingLocation = false,
  pickedPosition,
  onLocationPicked,
  seniorMode,
}) => {
  const defaultCenter = { lat: 23.9738, lng: 120.9820, zoom: 8 }; // Taiwan Center

  const handleNav = (place: Place) => {
    if (place.url) {
      window.open(place.url, '_blank');
    } else {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${place.name} ${place.city} ${place.district}`
      )}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={defaultCenter.zoom}
        className="w-full h-full z-10"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFlyController selectedPlace={selectedPlace} centerPosition={centerPosition} />
        <MapClickHandler
          isPickingLocation={isPickingLocation}
          onLocationPicked={onLocationPicked}
        />

        {/* Temporary marker when user is picking location on map */}
        {pickedPosition && (
          <Marker position={[pickedPosition.lat, pickedPosition.lng]} icon={selectionIcon}>
            <Popup autoPan={false}>
              <div className="p-2 text-center text-xs font-bold text-blue-700">
                📌 已選取此位置！
              </div>
            </Popup>
          </Marker>
        )}

        {/* Places Markers */}
        {places.map((place) => {
          const isSelected = selectedPlace?.id === place.id;

          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createCustomIcon(isSelected, place.category)}
              eventHandlers={{
                click: () => onSelectPlace(place),
              }}
            >
              <Popup className="food-popup">
                <div className="w-64 sm:w-72 overflow-hidden bg-white">
                  {place.image_url && (
                    <div className="h-32 w-full overflow-hidden relative">
                      <img
                        src={place.image_url}
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                      {place.category && (
                        <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                          {place.category}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-slate-900 text-base">{place.name}</h4>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-1.5 py-0.5 rounded">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{place.rating || 5.0}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      {place.city} {place.district}
                    </p>

                    {place.note && (
                      <p className="text-xs text-slate-700 bg-amber-50/80 p-2 rounded-lg mt-2 border border-amber-100 line-clamp-3">
                        💬 {place.note}
                      </p>
                    )}

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleNav(place)}
                        className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <Navigation className="w-3.5 h-3.5 fill-white" />
                        Google 地圖導航
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Picking Location Overlay Prompt */}
      {isPickingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm animate-bounce">
          <MapPin className="w-5 h-5 animate-pulse" />
          <span>請在地圖上點選美食位置！</span>
        </div>
      )}
    </div>
  );
};
