import React, { useState } from 'react';
import { Navigation, Trash2, MapPin, Copy, Check, Edit3, ExternalLink } from 'lucide-react';
import { Place } from '../types';
import { AutoFoodImage } from './AutoFoodImage';

interface PlaceCardProps {
  place: Place;
  isSelected?: boolean;
  onSelect: (place: Place) => void;
  onEdit: (place: Place) => void;
  onDelete: (id: string) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  const hasMap = !!(
    place.map_url ||
    (place.latitude !== null &&
      place.longitude !== null &&
      place.latitude !== undefined &&
      place.longitude !== undefined)
  );

  const handleOpenNav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (place.map_url) {
      window.open(place.map_url, '_blank');
    } else {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${place.name} ${place.city} ${place.district}`
      )}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const handleOpenFoodUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (place.food_url) {
      window.open(place.food_url, '_blank');
    }
  };

  // 複製「美食連結 (食記／IG／短影片／文章介紹)」
  const handleCopyFoodLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const linkToCopy = place.food_url || '';
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={() => onSelect(place)}
      className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
        isSelected
          ? 'ring-2 ring-orange-500 border-orange-500 bg-orange-50/20 shadow-md'
          : 'border-slate-200/80 hover:border-orange-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* 美食照片 (由美食連結取得之縮圖，無縮圖顯示「無圖片」) */}
        <div className="relative sm:w-36 h-36 sm:h-auto shrink-0 bg-slate-100 overflow-hidden">
          <AutoFoodImage
            place={place}
            className="group-hover:scale-105 transition-transform duration-300"
          />
          {/* 類別標籤 */}
          {place.category && (
            <span className="absolute top-2 left-2 bg-black/65 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
              {place.category}
            </span>
          )}

          {/* 無地圖標記小標籤 */}
          {!hasMap && (
            <span className="absolute bottom-2 left-2 bg-slate-800/80 backdrop-blur-md text-slate-200 text-[10px] font-medium px-2 py-0.5 rounded">
              僅文章清單
            </span>
          )}
        </div>

        {/* 卡片主要資訊 */}
        <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-black text-slate-900 leading-snug group-hover:text-orange-600 transition-colors text-base truncate">
                {place.name}
              </h3>
            </div>

            {/* 地區 */}
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>
                {place.city} • {place.district}
              </span>
            </div>

            {/* 私房備註 */}
            {place.note && (
              <p className="mt-1.5 text-slate-600 bg-amber-50/70 p-1.5 px-2 rounded-xl border border-amber-100/80 font-normal line-clamp-1 leading-relaxed text-xs">
                💬 {place.note}
              </p>
            )}
          </div>

          {/* 底部功能操作列 (嚴格單行排版：導航 / 介紹 / 編輯 / 複製 / 刪除) */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 flex-nowrap overflow-x-hidden">
            {/* 左側主要動作：導航、介紹 */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Google 導航按鈕 (僅有地圖連結時顯示) */}
              {hasMap && (
                <button
                  id={`btn-nav-${place.id}`}
                  onClick={handleOpenNav}
                  className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-sm hover:shadow active:scale-95 transition-all px-2 py-1 text-xs whitespace-nowrap"
                  title="開啟 Google 地圖進行即時導航"
                >
                  <Navigation className="w-3 h-3 fill-white" />
                  <span>導航</span>
                </button>
              )}

              {/* 介紹按鈕 (開啟美食連結) */}
              {place.food_url && (
                <button
                  onClick={handleOpenFoodUrl}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-sm hover:shadow active:scale-95 transition-all px-2 py-1 text-xs whitespace-nowrap"
                  title="開啟原始美食介紹連結"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>介紹</span>
                </button>
              )}
            </div>

            {/* 右側輔助動作：編輯、複製、刪除 */}
            <div className="flex items-center gap-1 shrink-0">
              {/* 編輯店家 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(place);
                }}
                className="px-2 py-1 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-lg text-xs font-semibold flex items-center gap-0.5 transition-all border border-slate-200/80 whitespace-nowrap"
                title="編輯店家資訊"
              >
                <Edit3 className="w-3 h-3" />
                <span>編輯</span>
              </button>

              {/* 複製美食連結 */}
              <button
                onClick={handleCopyFoodLink}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-0.5 transition-all border whitespace-nowrap ${
                  copied
                    ? 'bg-green-50 border-green-300 text-green-700 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                }`}
                title="複製美食文章分享連結"
              >
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '已複製' : '複製'}</span>
              </button>

              {/* 刪除 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`確定要刪除「${place.name}」嗎？`)) {
                    onDelete(place.id);
                  }
                }}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="刪除此私房地點"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
