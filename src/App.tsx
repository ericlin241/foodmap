import React, { useState, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { PlaceCard } from './components/PlaceCard';
import { MapView } from './components/MapView';
import { AddPlaceModal } from './components/AddPlaceModal';
import { RandomWheel } from './components/RandomWheel';
import { StatsModal } from './components/StatsModal';
import { usePlaces } from './hooks/usePlaces';
import { Place } from './types';
import { TAIWAN_LOCATIONS } from './data/taiwanDistricts';
import { Map, List, Plus, AlertCircle } from 'lucide-react';

export function App() {
  const {
    places,
    loading,
    addPlace,
    updatePlace,
    deletePlace,
  } = usePlaces();

  // Filters
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // UI state
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [noMapAlert, setNoMapAlert] = useState<string | null>(null);
  const alertTimerRef = useRef<any>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [isWheelModalOpen, setIsWheelModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Center position for map based on filter selection
  const mapCenterPosition = useMemo(() => {
    if (selectedDistrict && selectedCity) {
      const cityData = TAIWAN_LOCATIONS.find((c) => c.city === selectedCity);
      const dist = cityData?.districts.find((d) => d.name === selectedDistrict);
      if (dist) return { lat: dist.lat, lng: dist.lng, zoom: 14 };
    }
    if (selectedCity) {
      const cityData = TAIWAN_LOCATIONS.find((c) => c.city === selectedCity);
      if (cityData) return { lat: cityData.lat, lng: cityData.lng, zoom: 11 };
    }
    return null;
  }, [selectedCity, selectedDistrict]);

  // Filtered places
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      // City filter
      if (selectedCity && place.city !== selectedCity) return false;
      // District filter
      if (selectedDistrict && place.district !== selectedDistrict) return false;
      // Category filter
      if (selectedCategory && place.category !== selectedCategory) return false;
      // Search keyword filter
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchName = place.name.toLowerCase().includes(kw);
        const matchNote = (place.note || '').toLowerCase().includes(kw);
        const matchCategory = (place.category || '').toLowerCase().includes(kw);
        const matchDistrict = place.district.toLowerCase().includes(kw);
        if (!matchName && !matchNote && !matchCategory && !matchDistrict) return false;
      }
      return true;
    });
  }, [places, selectedCity, selectedDistrict, selectedCategory, searchKeyword]);

  // Places for Random Wheel
  const wheelCandidatePlaces = useMemo(() => {
    return places.filter((place) => {
      if (selectedCity && place.city !== selectedCity) return false;
      if (selectedDistrict && place.district !== selectedDistrict) return false;
      return true;
    });
  }, [places, selectedCity, selectedDistrict]);

  const handleResetFilters = () => {
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedCategory('');
    setSearchKeyword('');
  };

  const handleSelectPlace = (place: Place | null) => {
    setSelectedPlace(place);

    if (place) {
      const hasMap = !!(place.map_url || (place.latitude && place.longitude));

      // 若沒有 Google 地圖連結，地圖區跳出「尚未新增地圖」的小警示，顯示 3 秒
      if (!hasMap) {
        if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
        setNoMapAlert(`「${place.name}」尚未新增 Google 地圖`);
        alertTimerRef.current = setTimeout(() => {
          setNoMapAlert(null);
        }, 3000);
      } else {
        setNoMapAlert(null);
      }

      // On mobile, if in list view, switch to map view to show selection
      if (window.innerWidth < 768) {
        setMobileTab('map');
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingPlace(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (place: Place) => {
    setEditingPlace(place);
    setIsModalOpen(true);
  };

  const handleSavePlace = async (placeData: any) => {
    if (editingPlace) {
      await updatePlace(placeData as Place);
      if (selectedPlace?.id === editingPlace.id) {
        setSelectedPlace(placeData as Place);
      }
    } else {
      await addPlace(placeData);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* 頂部導航列 */}
      <Header
        onOpenAddModal={handleOpenAddModal}
        onOpenWheelModal={() => setIsWheelModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        totalPlaces={places.length}
      />

      {/* 主體區塊：Desktop 雙欄 / Mobile 視圖切換 */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* 左側欄：篩選器 + 美食列表 (電腦版固定左側，手機版切換) */}
        <aside
          className={`w-full md:w-[420px] lg:w-[480px] h-full flex flex-col bg-white border-r border-slate-200 z-20 transition-all ${
            mobileTab === 'list' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* 篩選操作列 */}
          <FilterBar
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            selectedDistrict={selectedDistrict}
            setSelectedDistrict={setSelectedDistrict}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
            onReset={handleResetFilters}
          />

          {/* 美食列表區塊 */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-xs font-bold text-slate-500">
                符合條件店家：<strong className="text-orange-600">{filteredPlaces.length}</strong> 家
              </span>
              <span className="text-xs text-slate-400">點擊卡片可於地圖定位</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm">正在載入美味地圖中...</p>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3 mt-4">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-700">找不到符合條件的美食地點</h4>
                <p className="text-xs text-slate-500">請嘗試清除篩選或新增您私房推薦的店家！</p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  清除所有篩選
                </button>
              </div>
            ) : (
              filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  isSelected={selectedPlace?.id === place.id}
                  onSelect={handleSelectPlace}
                  onEdit={handleOpenEditModal}
                  onDelete={deletePlace}
                />
              ))
            )}
          </div>
        </aside>

        {/* 右側欄：全螢幕互動地圖 */}
        <main
          className={`flex-1 h-full relative overflow-hidden ${
            mobileTab === 'map' ? 'block' : 'hidden md:block'
          }`}
        >
          <MapView
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={handleSelectPlace}
            onEditPlace={handleOpenEditModal}
            centerPosition={mapCenterPosition}
            noMapAlert={noMapAlert}
          />
        </main>
      </div>

      {/* 手機版底部導航與懸浮切換列 (上移並自適應 iPhone Safari 網址列與安全區) */}
      <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 pt-2 px-4 pb-4 sm:pb-5 safe-area-bottom flex items-center justify-around z-30 shadow-2xl">
        {/* 切換為地圖模式 */}
        <button
          id="btn-mobile-tab-map"
          onClick={() => setMobileTab('map')}
          className={`flex flex-col items-center gap-1 py-1.5 px-5 rounded-xl font-bold transition-all ${
            mobileTab === 'map' ? 'text-orange-600 bg-orange-50' : 'text-slate-500'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-xs">地圖檢視</span>
        </button>

        {/* 手機版中間大圓新增按鈕 (FAB) */}
        <button
          id="btn-mobile-fab-add"
          onClick={handleOpenAddModal}
          className="bg-gradient-to-r from-orange-600 to-amber-500 text-white p-3.5 -mt-6 rounded-full shadow-xl border-4 border-white active:scale-95 transition-all flex items-center justify-center"
          title="新增美食"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* 切換為列表模式 */}
        <button
          id="btn-mobile-tab-list"
          onClick={() => setMobileTab('list')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl font-bold transition-all ${
            mobileTab === 'list' ? 'text-orange-600 bg-orange-50' : 'text-slate-500'
          }`}
        >
          <List className="w-5 h-5" />
          <span className="text-xs">清單檢視 ({filteredPlaces.length})</span>
        </button>
      </div>

      {/* 新增／編輯美食地點彈窗 */}
      <AddPlaceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlace(null);
        }}
        onSavePlace={handleSavePlace}
        initialData={editingPlace}
      />

      {/* 隨機美食轉盤抽籤彈窗 */}
      <RandomWheel
        isOpen={isWheelModalOpen}
        onClose={() => setIsWheelModalOpen(false)}
        places={wheelCandidatePlaces}
        selectedCity={selectedCity}
        selectedDistrict={selectedDistrict}
        onSelectPlace={handleSelectPlace}
      />

      {/* 統計資訊彈窗 */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        places={places}
      />
    </div>
  );
}
export default App;
