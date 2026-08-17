import React, { useState } from 'react';
import { Sparkles, X, Navigation, Utensils, RefreshCw, Trophy } from 'lucide-react';
import { Place } from '../types';

interface RandomWheelProps {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
  onSelectPlace: (place: Place) => void;
  seniorMode: boolean;
}

export const RandomWheel: React.FC<RandomWheelProps> = ({
  isOpen,
  onClose,
  places,
  onSelectPlace,
  seniorMode,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Place | null>(null);
  const [displayCandidate, setDisplayCandidate] = useState<string>('點擊按鈕開始抽籤！');

  if (!isOpen) return null;

  const handleSpin = () => {
    if (places.length === 0) return;
    setIsSpinning(true);
    setSelectedResult(null);

    let counter = 0;
    const totalFlips = 25;
    const intervalTime = 80;

    const timer = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * places.length);
      setDisplayCandidate(places[randomIndex].name);
      counter++;

      if (counter >= totalFlips) {
        clearInterval(timer);
        const finalPlace = places[Math.floor(Math.random() * places.length)];
        setDisplayCandidate(finalPlace.name);
        setSelectedResult(finalPlace);
        setIsSpinning(false);
      }
    }, intervalTime);
  };

  const handleGoTo = () => {
    if (selectedResult) {
      onSelectPlace(selectedResult);
      onClose();
    }
  };

  const handleNav = () => {
    if (!selectedResult) return;
    if (selectedResult.url) {
      window.open(selectedResult.url, '_blank');
    } else {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${selectedResult.name} ${selectedResult.city} ${selectedResult.district}`
      )}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-200 animate-spin" />
            <h3 className={`font-black tracking-tight ${seniorMode ? 'text-2xl' : 'text-xl'}`}>
              🎲 今天吃什麼？
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-6">
          <p className="text-slate-600 text-sm">
            從目前收藏的 <strong className="text-orange-600 font-bold">{places.length}</strong> 家美食名單中隨機抽取：
          </p>

          {/* 滾動抽籤看板 */}
          <div
            className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center min-h-[140px] transition-all ${
              selectedResult
                ? 'bg-gradient-to-b from-amber-50 to-orange-50 border-orange-400 shadow-inner'
                : isSpinning
                ? 'bg-orange-50/50 border-orange-300 animate-pulse'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            {selectedResult ? (
              <div className="space-y-2 animate-in zoom-in-75">
                <span className="text-3xl">🎉</span>
                <div className="text-xs font-bold text-orange-600 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  今日推薦決定！
                </div>
                <h4 className="text-2xl font-black text-slate-900">{selectedResult.name}</h4>
                <p className="text-xs text-slate-500 font-medium">
                  📍 {selectedResult.city} {selectedResult.district} • {selectedResult.category || '精選美食'}
                </p>
                {selectedResult.note && (
                  <p className="text-xs text-slate-700 bg-white/80 p-2 rounded-lg border border-amber-200 mt-2 font-normal">
                    💬 {selectedResult.note}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Utensils className={`w-8 h-8 mx-auto ${isSpinning ? 'text-orange-500 animate-bounce' : 'text-slate-400'}`} />
                <div className={`font-black ${isSpinning ? 'text-2xl text-orange-600' : 'text-lg text-slate-600'}`}>
                  {displayCandidate}
                </div>
              </div>
            )}
          </div>

          {/* 按鈕群組 */}
          <div className="space-y-3">
            <button
              onClick={handleSpin}
              disabled={isSpinning || places.length === 0}
              className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 ${
                seniorMode ? 'py-4 text-xl' : 'py-3 text-base'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? '正在為您挑選中...' : selectedResult ? '不滿意？再抽一次！' : '開始隨機抽籤'}</span>
            </button>

            {selectedResult && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleGoTo}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition-all"
                >
                  在地圖上查看
                </button>
                <button
                  onClick={handleNav}
                  className="py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  開啟 Google 導航
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
