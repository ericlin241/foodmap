import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Place } from '../types';
import { Navigation, MapPin, X, Copy, Check, Edit3 } from 'lucide-react';

// Custom Marker Icons (Pinned precisely at center-bottom tip, always crisp and visible)
const createCustomIcon = (isSelected: boolean) => {
  const width = isSelected ? 48 : 38;
  const height = isSelected ? 60 : 48;
  const pinBg = isSelected ? '#dc2626' : '#ea580c';
  const strokeColor = '#ffffff';

  const svgHtml = `
    <div style="width: ${width}px; height: ${height}px; position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));">
      <svg width="${width}" height="${height}" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 0; left: 0; display: block;">
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
    className: `custom-food-marker ${isSelected ? 'custom-marker-active' : ''}`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
  });
};

// Component to handle smooth flyTo and exact map centering
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
      map.setView([selectedPlace.latitude, selectedPlace.longitude], 16, {
        animate: true,
      });
    } else if (centerPosition) {
      map.flyTo([centerPosition.lat, centerPosition.lng], centerPosition.zoom || 13, {
        animate: true,
        duration: 0.8,
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

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place | null) => void;
  onEditPlace?: (place: Place) => void;
  centerPosition?: { lat: number; lng: number; zoom?: number } | null;
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onEditPlace,
  centerPosition,
}) => {
  const defaultCenter = { lat: 23.9738, lng: 120.982, zoom: 8 };
  const [copied, setCopied] = React.useState(false);

  const defaultImg =
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';

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

  // Copy place Google Map link
  const handleCopyLink = (place: Place) => {
    const linkToCopy = place.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.city} ${place.district}`)}`;
    navigator.clipboard.writeText(linkToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createCustomIcon(isSelected)}
              eventHandlers={{
                click: () => onSelectPlace(place),
              }}
            />
          );
        })}
      </MapContainer>

      {/* 固定右上角的美食資訊圖卡 (最上最右留白間距) */}
      {selectedPlace && (
        <div className="absolute top-4 right-4 z-30 w-80 sm:w-96 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          {/* 照片區塊 */}
          <div className="relative h-40 sm:h-44 w-full bg-slate-100 overflow-hidden">
            <img
              src={selectedPlace.image_url || defaultImg}
              alt={selectedPlace.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultImg;
              }}
              className="w-full h-full object-cover"
            />
            {/* 關閉按鈕 */}
            <button
              onClick={() => onSelectPlace(null)}
              className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 backdrop-blur-md shadow transition-all active:scale-95"
              title="關閉卡片"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 類別標籤 */}
            {selectedPlace.category && (
              <span className="absolute bottom-2.5 left-2.5 bg-orange-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm shadow">
                {selectedPlace.category}
              </span>
            )}
          </div>

          {/* 內容區塊 */}
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-black text-slate-900 text-lg sm:text-xl leading-tight">
                  {selectedPlace.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                  {selectedPlace.city} • {selectedPlace.district}
                </p>
              </div>

              {/* 圖卡編輯按鈕 */}
              {onEditPlace && (
                <button
                  onClick={() => onEditPlace(selectedPlace)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-xl text-xs font-bold transition-all border border-slate-200"
                  title="編輯店家資訊"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>編輯</span>
                </button>
              )}
            </div>

            {/* 私房備註 */}
            {selectedPlace.note && (
              <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-24 overflow-y-auto">
                💬 <span className="font-medium">{selectedPlace.note}</span>
              </div>
            )}

            {/* 功能按鈕列 (移除 LINE，複製按鈕為複製連結) */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => handleNav(selectedPlace)}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Google 地圖導航</span>
              </button>

              <button
                onClick={() => handleCopyLink(selectedPlace)}
                className={`py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border transition-all ${
                  copied
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
                title="複製 Google 地圖美食連結"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已複製連結' : '複製連結'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
