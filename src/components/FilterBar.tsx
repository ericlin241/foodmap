import React from 'react';
import { Search, MapPin, Tag, RotateCcw } from 'lucide-react';
import { TAIWAN_LOCATIONS, FOOD_CATEGORIES } from '../data/taiwanDistricts';

interface FilterBarProps {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCity,
  setSelectedCity,
  selectedDistrict,
  setSelectedDistrict,
  selectedCategory,
  setSelectedCategory,
  searchKeyword,
  setSearchKeyword,
  onReset,
}) => {
  // Find current city's district list
  const currentCityData = TAIWAN_LOCATIONS.find((c) => c.city === selectedCity);
  const districtList = currentCityData ? currentCityData.districts : [];

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
    setSelectedDistrict('');
  };

  return (
    <div className="bg-white border-b border-slate-200 p-3 sm:p-4 shadow-sm space-y-3">
      {/* 搜尋關鍵字 */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          id="input-search-keyword"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="搜尋店名、必吃招牌菜、備註關鍵字..."
          className="w-full pl-11 pr-4 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
        />
        {searchKeyword && (
          <button
            onClick={() => setSearchKeyword('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-slate-200 hover:bg-slate-300 rounded-full w-5 h-5 flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>

      {/* 縣市、鄉鎮市區、類別 三重連動選單 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* 縣市選單 */}
        <div className="relative">
          <select
            id="select-city"
            value={selectedCity}
            onChange={handleCityChange}
            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-8 font-medium text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm"
          >
            <option value="">全台灣 (全部縣市)</option>
            {TAIWAN_LOCATIONS.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city}
              </option>
            ))}
          </select>
          <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* 行政區選單 */}
        <div className="relative">
          <select
            id="select-district"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedCity}
            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-8 font-medium text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 text-sm"
          >
            <option value="">全部行政區</option>
            {districtList.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">▼</span>
        </div>

        {/* 料理類別選單 */}
        <div className="relative col-span-2 sm:col-span-1">
          <select
            id="select-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-8 font-medium text-slate-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-sm"
          >
            {FOOD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat === '全部類別' ? '' : cat}>
                {cat}
              </option>
            ))}
          </select>
          <Tag className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* 篩選標籤與清除按鈕 */}
      {(selectedCity || selectedDistrict || selectedCategory || searchKeyword) && (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
          <span className="truncate">
            篩選中：
            {selectedCity && <strong className="text-orange-600 ml-1">{selectedCity}</strong>}
            {selectedDistrict && <strong className="text-orange-600 ml-1">{selectedDistrict}</strong>}
            {selectedCategory && <strong className="text-amber-600 ml-1">[{selectedCategory}]</strong>}
            {searchKeyword && <strong className="text-slate-800 ml-1">"{searchKeyword}"</strong>}
          </span>
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-slate-500 hover:text-orange-600 font-semibold px-2 py-1 rounded-md hover:bg-slate-100 transition-all shrink-0 ml-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重設篩選
          </button>
        </div>
      )}
    </div>
  );
};
