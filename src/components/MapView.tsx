import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Place } from '../types';
import { Navigation, MapPin, X, Copy, Check, Edit3, ExternalLink, AlertTriangle } from 'lucide-react';
import { AutoFoodImage } from './AutoFoodImage';

// Custom Marker Icons (Pinned at center-bottom tip, with pin-wrapper for vertical bounce)
const createCustomIcon = (isSelected: boolean) => {
  const width = isSelected ? 48 : 38;
  const height = isSelected ? 60 : 48;
  const pinBg = isSelected ? '#dc2626' : '#ea580c';
  const strokeColor = '#ffffff';

  const svgHtml = `
    <div class="pin-wrapper" style="width: ${width}px; height: ${height}px; position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5)); transition: transform 0.2s ease;">
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
  mapPlaces,
}: {
  selectedPlace: Place | null;
  centerPosition?: { lat: number; lng: number; zoom?: number } | null;
  mapPlaces: Place[];
}) {
  const map = useMap();

  useEffect(() => {
    if (
      selectedPlace &&
      selectedPlace.latitude !== null &&
      selectedPlace.longitude !== null &&
      selectedPlace.latitude !== undefined &&
      selectedPlace.longitude !== undefined
    ) {
      const isMobile = window.innerWidth < 768;
      const zoomLevel = 16;
      const targetLatLng = L.latLng(selectedPlace.latitude, selectedPlace.longitude);

      if (isMobile) {
        // On mobile, the top is occupied by the floating place card (~240px)
        // and the bottom is occupied by the elevated bottom navigation bar (~75px).
        // To place the pin exactly in the vertical center of the visible area between the card bottom and navigation top,
        // we offset the map center downward by ~80px.
        const point = map.project(targetLatLng, zoomLevel);
        const offsetPoint = L.point(point.x, point.y + 75);
        const offsetLatLng = map.unproject(offsetPoint, zoomLevel);
        map.setView(offsetLatLng, zoomLevel, { animate: true });
      } else {
        map.setView(targetLatLng, zoomLevel, { animate: true });
      }
    } else if (centerPosition) {
      map.flyTo([centerPosition.lat, centerPosition.lng], centerPosition.zoom || 13, {
        animate: true,
        duration: 0.8,
      });
    } else if (mapPlaces.length > 0) {
      const validPlaces = mapPlaces.filter(
        (p) =>
          p.latitude !== null &&
          p.longitude !== null &&
          !isNaN(p.latitude as number) &&
          !isNaN(p.longitude as number)
      );
      if (validPlaces.length > 0) {
        const bounds = L.latLngBounds(
          validPlaces.map((p) => [p.latitude as number, p.longitude as number])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [selectedPlace, centerPosition, mapPlaces, map]);

  return null;
}

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place | null) => void;
  onEditPlace?: (place: Place) => void;
  centerPosition?: { lat: number; lng: number; zoom?: number } | null;
  noMapAlert: string | null;
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onEditPlace,
  centerPosition,
  noMapAlert,
}) => {
  const defaultCenter = { lat: 23.9738, lng: 120.982, zoom: 8 };
  const [copied, setCopied] = React.useState(false);

  // Filter only places with valid map coordinates for Leaflet Markers (always kept rendered)
  const mapPlaces = useMemo(() => {
    return places.filter(
      (p) =>
        p.latitude !== null &&
        p.longitude !== null &&
        p.latitude !== undefined &&
        p.longitude !== undefined &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude)
    );
  }, [places]);

  const hasMap = !!(
    selectedPlace &&
    (selectedPlace.map_url || (selectedPlace.latitude && selectedPlace.longitude))
  );

  const handleNav = (place: Place) => {
    if (place.map_url) {
      window.open(place.map_url, '_blank');
    } else {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${place.name} ${place.city} ${place.district}`
      )}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const handleOpenFoodUrl = (place: Place) => {
    if (place.food_url) {
      window.open(place.food_url, '_blank');
    }
  };

  // 複製「美食連結 (食記／IG／短影片／文章介紹)」
  const handleCopyFoodLink = (place: Place) => {
    const linkToCopy = place.food_url || '';
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          mapPlaces={mapPlaces}
        />

        {/* Places Markers (所有具備座標的地點常駐顯示，選取者微微上下跳動) */}
        {mapPlaces.map((place) => {
          const isSelected = selectedPlace?.id === place.id;

          return (
            <Marker
              key={place.id}
              position={[place.latitude as number, place.longitude as number]}
              icon={createCustomIcon(isSelected)}
              eventHandlers={{
                click: () => onSelectPlace(place),
              }}
            />
          );
        })}
      </MapContainer>

      {/* 尚未新增地圖的小警示 (置底於地圖下方，顯示 3 秒) */}
      {noMapAlert && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
          <div>
            <p className="font-bold text-sm text-amber-200">{noMapAlert}</p>
            <p className="text-[11px] text-slate-300">此店家尚未填寫 Google 地圖連結，僅在左側清單顯示</p>
          </div>
        </div>
      )}

      {/* 固定右上角的美食資訊圖卡 (手機版居中精巧留白、電腦版置於右上角) */}
      {selectedPlace && (
        <div className="absolute top-3 left-3 right-3 sm:left-auto sm:right-4 z-30 sm:w-96 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          {/* 照片區塊 (使用美食連結的縮圖，無縮圖顯示「無圖片」) */}
          <div className="relative h-36 sm:h-44 w-full bg-slate-100 overflow-hidden">
            <AutoFoodImage place={selectedPlace} />
            {/* 關閉按鈕 */}
            <button
              onClick={() => onSelectPlace(null)}
              className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 backdrop-blur-md shadow transition-all active:scale-95 z-20"
              title="關閉卡片"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 類別標籤 */}
            {selectedPlace.category && (
              <span className="absolute bottom-2.5 left-2.5 bg-orange-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm shadow z-20">
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

            {/* 功能按鈕列 (右上角填滿整排橫排、無空格：導航 / 介紹 / 複製) */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 w-full">
              {/* 導航按鈕 (僅在有地圖連結時顯示，均分寬度) */}
              {hasMap && (
                <button
                  onClick={() => handleNav(selectedPlace)}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
                  title="開啟 Google 地圖導航"
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  <span>導航</span>
                </button>
              )}

              {/* 介紹按鈕 (均分寬度) */}
              {selectedPlace.food_url && (
                <button
                  onClick={() => handleOpenFoodUrl(selectedPlace)}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
                  title="開啟原始美食介紹連結"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>介紹</span>
                </button>
              )}

              {/* 複製美食連結按鈕 (均分寬度，填滿橫排) */}
              <button
                onClick={() => handleCopyFoodLink(selectedPlace)}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 border transition-all ${
                  copied
                    ? 'bg-green-50 border-green-300 text-green-700 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
                title="複製美食食記或文章連結"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已複製' : '複製'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
