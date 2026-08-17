import React from 'react';
import { Utensils, Sparkles, Plus, Layers } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenWheelModal: () => void;
  onOpenStatsModal: () => void;
  totalPlaces: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenWheelModal,
  onOpenStatsModal,
  totalPlaces,
}) => {
  return (
    <header className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white shadow-md z-30 sticky top-0 px-4 py-3 sm:px-6 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 sm:p-2.5 rounded-2xl backdrop-blur-sm shadow-inner flex items-center justify-center">
          <Utensils className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black tracking-tight text-xl sm:text-2xl">
              台灣美食地圖
            </h1>
            <span className="hidden sm:inline-block bg-orange-800/40 text-orange-100 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-orange-400/30">
              {totalPlaces} 家私房口袋名單
            </span>
          </div>
          <p className="text-xs sm:text-sm text-orange-100/90 font-medium">
            景點食記永久收藏
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* 今天吃什麼？抽籤轉盤 */}
        <button
          id="btn-random-wheel"
          onClick={onOpenWheelModal}
          className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-md active:scale-95 transition-all text-xs sm:text-sm"
          title="今天不知道吃什麼？讓系統幫你從當前選取區域抽籤！"
        >
          <Sparkles className="w-4 h-4 text-amber-900" />
          <span className="hidden md:inline">今天吃什麼？</span>
          <span className="md:hidden">抽籤</span>
        </button>

        {/* 美食統計概況 */}
        <button
          id="btn-stats"
          onClick={onOpenStatsModal}
          className="p-2 sm:px-3 sm:py-2.5 bg-white/15 hover:bg-white/25 rounded-xl backdrop-blur-sm transition-all text-xs sm:text-sm font-medium flex items-center gap-1"
          title="查看美食分佈統計"
        >
          <Layers className="w-4 h-4" />
          <span className="hidden lg:inline">地圖概況</span>
        </button>

        {/* 電腦版頂部新增按鈕 */}
        <button
          id="btn-desktop-add"
          onClick={onOpenAddModal}
          className="hidden sm:flex items-center gap-1.5 bg-white text-orange-600 hover:bg-orange-50 font-extrabold px-3.5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all text-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>新增美食</span>
        </button>
      </div>
    </header>
  );
};
