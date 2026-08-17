import React from 'react';
import { X, MapPin, PieChart, Bookmark } from 'lucide-react';
import { Place } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  places,
}) => {
  if (!isOpen) return null;

  // City distribution counts
  const cityCounts: { [key: string]: number } = {};
  const categoryCounts: { [key: string]: number } = {};

  places.forEach((p) => {
    cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
    const cat = p.category || '未分類';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-6 h-6" />
            <h3 className="font-black tracking-tight text-xl">
              📊 私房美食地圖統計
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50/80 p-4 rounded-2xl border border-orange-200/60 text-center">
              <span className="text-xs font-bold text-orange-700">總收藏店家數</span>
              <div className="text-3xl font-black text-orange-600 mt-1">{places.length} <span className="text-sm font-normal">家</span></div>
            </div>
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/60 text-center">
              <span className="text-xs font-bold text-amber-700">涵蓋縣市數</span>
              <div className="text-3xl font-black text-amber-600 mt-1">{sortedCities.length} <span className="text-sm font-normal">縣市</span></div>
            </div>
          </div>

          {/* 各縣市分佈 */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-600" />
              縣市美食分佈排行榜
            </h4>
            <div className="space-y-2">
              {sortedCities.map(([city, count]) => {
                const percentage = places.length > 0 ? Math.round((count / places.length) * 100) : 0;
                return (
                  <div key={city} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>{city}</span>
                      <span>{count} 家 ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 料理類別分佈 */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-amber-600" />
              美食料理類別
            </h4>
            <div className="flex flex-wrap gap-2">
              {sortedCategories.map(([cat, count]) => (
                <div
                  key={cat}
                  className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <span>{cat}</span>
                  <span className="bg-amber-200/80 px-1.5 py-0.5 rounded-md text-[10px]">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-sm transition-all"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
