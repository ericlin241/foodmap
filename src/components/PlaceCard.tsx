import React, { useState } from 'react';
import { Navigation, Share2, Trash2, MapPin, Star, ExternalLink, MessageCircle, Copy, Check } from 'lucide-react';
import { Place } from '../types';

interface PlaceCardProps {
  place: Place;
  isSelected?: boolean;
  onSelect: (place: Place) => void;
  onDelete: (id: string) => void;
  seniorMode: boolean;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSelected,
  onSelect,
  onDelete,
  seniorMode,
}) => {
  const [copied, setCopied] = useState(false);

  // Fallback image if image_url fails or is empty
  const defaultImg =
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';

  const handleOpenNav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (place.url) {
      window.open(place.url, '_blank');
    } else {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${place.name} ${place.city} ${place.district}`
      )}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const handleShareLine = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `🍲 私房推薦美食【${place.name}】\n📍 位置：${place.city}${place.district}\n📝 推薦：${place.note || '超好吃必點！'}\n🔗 地圖：${place.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`}`;
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank');
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `【${place.name}】(${place.city}${place.district})\n推薦備註：${place.note || '無'}\n連結：${place.url || ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        {/* 美食照片 */}
        <div className="relative sm:w-36 h-36 sm:h-auto shrink-0 bg-slate-100 overflow-hidden">
          <img
            src={place.image_url || defaultImg}
            alt={place.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImg;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {/* 類別標籤 */}
          {place.category && (
            <span className="absolute top-2 left-2 bg-black/65 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
              {place.category}
            </span>
          )}
        </div>

        {/* 卡片主要資訊 */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3
                className={`font-black text-slate-900 leading-snug group-hover:text-orange-600 transition-colors ${
                  seniorMode ? 'text-xl' : 'text-base'
                }`}
              >
                {place.name}
              </h3>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{place.rating || 5.0}</span>
              </div>
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
              <p
                className={`mt-2 text-slate-600 bg-amber-50/70 p-2 rounded-xl border border-amber-100/80 font-normal line-clamp-2 leading-relaxed ${
                  seniorMode ? 'text-base font-medium text-slate-800' : 'text-xs'
                }`}
              >
                💬 {place.note}
              </p>
            )}
          </div>

          {/* 底部功能操作列 (長輩超大觸控按鈕) */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            {/* 一鍵 Google Maps 導航 */}
            <button
              id={`btn-nav-${place.id}`}
              onClick={handleOpenNav}
              className={`flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all ${
                seniorMode ? 'px-4 py-2.5 text-base' : 'px-3 py-1.5 text-xs'
              }`}
              title="開啟 Google 地圖進行即時導航"
            >
              <Navigation className="w-4 h-4 fill-white" />
              <span>導航前往</span>
            </button>

            <div className="flex items-center gap-1.5">
              {/* 分享到 LINE */}
              <button
                onClick={handleShareLine}
                className="p-1.5 sm:px-2 sm:py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                title="分享這家店到 LINE 給家人好友"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LINE</span>
              </button>

              {/* 複製文字 */}
              <button
                onClick={handleCopy}
                className="p-1.5 sm:px-2 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                title="複製店家資訊"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? '已複製' : '複製'}</span>
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
