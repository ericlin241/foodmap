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

  const defaultImg =
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';

  const hasMap = !!(place.map_url || (place.latitude !== null && place.longitude !== null && place.latitude !== undefined && place.longitude !== undefined));

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
        {/* 美食照片 (由美食連結取得之縮圖) */}
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
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-black text-slate-900 leading-snug group-hover:text-orange-600 transition-colors text-base sm:text-lg">
                {place.name}
              </h3>
            </div>

            {/* 地區 */}
            <div className="flex items-center gap-1 text-slate-500 text-xs sm:text-sm mt-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>
                {place.city} • {place.district}
              </span>
            </div>

            {/* 私房備註 */}
            {place.note && (
              <p className="mt-2 text-slate-600 bg-amber-50/70 p-2 rounded-xl border border-amber-100/80 font-normal line-clamp-2 leading-relaxed text-xs sm:text-sm">
                💬 {place.note}
              </p>
            )}
          </div>

          {/* 底部功能操作列 (導航、看介紹、編輯、複製美食連結、刪除) */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Google 導航按鈕 (僅有地圖連結時顯示) */}
              {hasMap && (
                <button
                  id={`btn-nav-${place.id}`}
                  onClick={handleOpenNav}
                  className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all px-2.5 py-1.5 text-xs"
                  title="開啟 Google 地圖進行即時導航"
                >
                  <Navigation className="w-3.5 h-3.5 fill-white" />
                  <span>導航</span>
                </button>
              )}

              {/* 查看介紹美食連結按鈕 */}
              {place.food_url && (
                <button
                  onClick={handleOpenFoodUrl}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all px-2.5 py-1.5 text-xs"
                  title="開啟原始美食介紹連結"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>看介紹</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* 編輯店家 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(place);
                }}
                className="p-1.5 sm:px-2 sm:py-1.5 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all border border-slate-200/80"
                title="編輯店家資訊"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">編輯</span>
              </button>

              {/* 複製「美食連結」 */}
              <button
                onClick={handleCopyFoodLink}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all border ${
                  copied
                    ? 'bg-green-50 border-green-300 text-green-700 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                }`}
                title="複製美食食記或文章分享連結"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
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
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="刪除此私房地點"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
