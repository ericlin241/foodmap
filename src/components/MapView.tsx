import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Place } from '../types';
import { Navigation, Star, MapPin } from 'lucide-react';

// Custom Marker Icons (Super clear, distinct orange pin with food emoji)
const createCustomIcon = (isSelected: boolean) => {
  const width = isSelected ? 46 : 38;
  const height = isSelected ? 58 : 48;
  const pinBg = isSelected ? '#dc2626' : '#ea580c'; // Highlighted in bold red-orange
  const strokeColor = '#ffffff';

  const svgHtml = `
    <div style="width: ${width}px; height: ${height}px; position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4));">
      <svg width="${width}" height="${height}" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 0; left: 0;">
        <path d="M19 0C8.50659 0 0 8.50659 0 19C0 31.5 19 48 19 48C19 48 38 31.5 38 19C38 8.50659 29.4934 0 19 0Z" fill="${pinBg}" stroke="${strokeColor}" stroke-width="2.5"/>
        <circle cx="19" cy="18" r="13.5" fill="#ffffff"/>
      </svg>
      <div style="position: relative; z-index: 2; margin-top: ${isSelected ? 8 : 6}px; font-size: ${isSelected ? 20 : 16}px; line-height: 1; user-select: none;">
        🍲
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: isSelected ? 'custom-marker-active' : '',
    iconSize: [width, height],
    iconAnchor: [width / 2, height], // 精準釘尖對齊座標
    popupAnchor: [0, -height + 4],
  });
};

// Component to handle smooth flyTo and auto-centering
function MapFlyController({
  selectedPlace,
  centerPosition,
  places,
}: {
  selectedPlace: Place | null;
  centerPosition?: { lat: number; lng: number; zoom?: number } | null;
  places: Place[];
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace) {
      map.flyTo([selectedPlace.latitude, selectedPlace.longitude], 16, {
        animate: true,
        duration: 1.0,
      });
    } else if (centerPosition) {
      map.flyTo([centerPosition.lat, centerPosition.lng], centerPosition.zoom || 13, {
        animate: true,
        duration: 1.0,
      });
    } else if (places.length > 0) {
      const validPlaces = places.filter((p) => !isNaN(p.latitude) && !isNaN(p.longitude));
      if (validPlaces.length > 0) {
        const bounds = L.latLngBounds(validPlaces.map((p) => [p.latitude, p.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [selectedPlace, centerPosition, places, map]);

  return null;
}

// Single Marker with Ref for Auto Popup Opening
function MarkerItem({
  place,
  isSelected,
  onSelectPlace,
  handleNav,
}: {
  place: Place;
  isSelected: boolean;
  onSelectPlace: (place: Place) => void;
  handleNav: (place: Place) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  return (
    <Marker
      ref={markerRef}
      position={[place.latitude, place.longitude]}
      icon={createCustomIcon(isSelected)}
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
}

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place | null) => void;
  centerPosition?: { lat: number; lng: number; zoom?: number } | null;
  seniorMode: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  centerPosition,
  seniorMode,
}) => {
  const defaultCenter = { lat: 23.9738, lng: 120.982, zoom: 8 }; // Taiwan Center

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

        <MapFlyController
          selectedPlace={selectedPlace}
          centerPosition={centerPosition}
          places={places}
        />

        {/* Places Markers */}
        {places.map((place) => {
          const isSelected = selectedPlace?.id === place.id;

          return (
            <MarkerItem
              key={place.id}
              place={place}
              isSelected={isSelected}
              onSelectPlace={onSelectPlace}
              handleNav={handleNav}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};
