import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Place } from '../types';
import { Navigation, MapPin, X, MessageCircle, Copy, Check } from 'lucide-react';

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
    iconAnchor: [width / 2, height], // 正下方尖端精準置中對齊
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
      // 點選店家時：將地圖視角正正對準經緯度，讓圖釘完全處於畫面正中間
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
  centerPosition?: { lat: number; lng: number; zoom?: number } | null;
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
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

  const handleShareLine = (place: Place) => {
    const text = `🍲 私房推薦美食【${place.name}】\n📍 位置：${place.city}${place.district}\n📝 推薦：${place.note || '超好吃必點！'}\n🔗 地圖：${place.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`}`;
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank');
  };

  const handleCopy = (place: Place) => {
    const text = `【${place.name}】(${place.city}${place.district})\n推薦備註：${place.note || '無'}\n連結：${place.url || ''}`;
    navigator.clipboard.writeText(text);
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
            <div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl leading-tight">
                {selectedPlace.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                {selectedPlace.city} • {selectedPlace.district}
              </p>
            </div>

            {/* 私房備註 */}
            {selectedPlace.note && (
              <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-24 overflow-y-auto">
                💬 <span className="font-medium">{selectedPlace.note}</span>
              </div>
            )}

            {/* 功能按鈕列 */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => handleNav(selectedPlace)}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Google 地圖導航</span>
              </button>

              <button
                onClick={() => handleShareLine(selectedPlace)}
                className="p-2.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                title="分享到 LINE"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">LINE</span>
              </button>

              <button
                onClick={() => handleCopy(selectedPlace)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 transition-all"
                title="複製店家資訊"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
