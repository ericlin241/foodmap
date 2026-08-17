import React, { useState, useEffect } from 'react';
import { X, Link2, MapPin, AlertCircle, Utensils } from 'lucide-react';
import { Place } from '../types';
import { TAIWAN_LOCATIONS, FOOD_CATEGORIES } from '../data/taiwanDistricts';

interface PlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlace: (placeData: Omit<Place, 'id' | 'created_at'> | Place) => Promise<any>;
  initialData?: Place | null;
}

export const AddPlaceModal: React.FC<PlaceModalProps> = ({
  isOpen,
  onClose,
  onSavePlace,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [foodUrl, setFoodUrl] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [city, setCity] = useState('台北市');
  const [district, setDistrict] = useState('中正區');
  const [category, setCategory] = useState('經典小吃');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setFoodUrl(initialData.food_url || (initialData as any).url || '');
      setMapUrl(initialData.map_url || (initialData.latitude ? (initialData as any).url : '') || '');
      setCity(initialData.city || '台北市');
      setDistrict(initialData.district || '中正區');
      setCategory(initialData.category || '經典小吃');
      setNote(initialData.note || '');
    } else {
      setName('');
      setFoodUrl('');
      setMapUrl('');
      setCity('台北市');
      setDistrict('中正區');
      setCategory('經典小吃');
      setNote('');
    }
    setError(null);
  }, [initialData, isOpen]);

  // When city changes, update district default
  const handleCityChange = (cityName: string) => {
    setCity(cityName);
    const cityData = TAIWAN_LOCATIONS.find((c) => c.city === cityName);
    if (cityData && cityData.districts.length > 0) {
      setDistrict(cityData.districts[0].name);
    }
  };

  // Auto extract coordinates from Google Maps URL if provided
  const extractCoordsFromMapUrl = (inputUrl: string) => {
    if (!inputUrl || !inputUrl.trim()) return null;

    const coordMatch = inputUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch && coordMatch[1] && coordMatch[2]) {
      return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
    }

    const dMatch = inputUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (dMatch && dMatch[1] && dMatch[2]) {
      return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
    }

    const queryCoordMatch = inputUrl.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (queryCoordMatch && queryCoordMatch[1] && queryCoordMatch[2]) {
      return { lat: parseFloat(queryCoordMatch[1]), lng: parseFloat(queryCoordMatch[2]) };
    }

    return null;
  };

  // Helper: Extract or fetch thumbnail from food_url
  const getThumbnailFromFoodUrl = (url: string, cat: string) => {
    if (!url) return '';

    // Direct Image URL detection
    if (/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(url)) {
      return url;
    }

    // YouTube Video / Shorts Thumbnail
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }

    // Category Curated High-Quality Food Photo
    const categoryImages: { [key: string]: string } = {
      '經典小吃': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80',
      '傳統麵食': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
      '海鮮熱炒': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
      '火鍋鍋物': 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=800&auto=format&fit=crop&q=80',
      '早午餐/豆漿': 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80',
      '甜品冰品': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
      '咖啡茶飲': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
      '夜市必吃': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      '家庭聚餐': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
      '其他': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
    };

    return categoryImages[cat] || categoryImages['經典小吃'];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('請輸入店家名稱！');
      return;
    }
    if (!foodUrl.trim()) {
      setError('請輸入美食連結（必填）！');
      return;
    }

    // Google Maps coordinates logic:
    // If map_url is provided, calculate coordinates. If not provided, lat/lng will be null (won't show on map).
    let finalLat: number | null = null;
    let finalLng: number | null = null;

    if (mapUrl.trim()) {
      const urlCoords = extractCoordsFromMapUrl(mapUrl.trim());
      if (urlCoords) {
        finalLat = urlCoords.lat;
        finalLng = urlCoords.lng;
      } else {
        // Fallback to district center
        const cityData = TAIWAN_LOCATIONS.find((c) => c.city === city);
        const distData = cityData?.districts.find((d) => d.name === district);
        finalLat = distData?.lat || cityData?.lat || 25.0375;
        finalLng = distData?.lng || cityData?.lng || 121.5637;
      }
    }

    // Extract thumbnail from food_url
    const autoImageUrl = getThumbnailFromFoodUrl(foodUrl.trim(), category);

    setSubmitting(true);
    setError(null);

    try {
      if (isEditing && initialData) {
        await onSavePlace({
          ...initialData,
          name: name.trim(),
          food_url: foodUrl.trim(),
          map_url: mapUrl.trim(),
          image_url: autoImageUrl,
          city,
          district,
          category,
          note: note.trim(),
          latitude: finalLat,
          longitude: finalLng,
        });
      } else {
        await onSavePlace({
          name: name.trim(),
          food_url: foodUrl.trim(),
          map_url: mapUrl.trim(),
          image_url: autoImageUrl,
          city,
          district,
          category,
          note: note.trim(),
          latitude: finalLat,
          longitude: finalLng,
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || '儲存失敗，請稍候再試！');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentCityData = TAIWAN_LOCATIONS.find((c) => c.city === city);
  const districtList = currentCityData ? currentCityData.districts : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍲</span>
            <h2 className="font-black tracking-tight text-xl">
              {isEditing ? '編輯美食資訊' : '新增私房美食'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 店家名稱 */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 text-sm">
              店名 / 美食名稱 <span className="text-orange-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：阿堂鹹粥、林東芳牛肉麵"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all text-sm font-semibold"
            />
          </div>

          {/* 美食連結 (必填) */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 text-sm">
              美食連結 (食記／IG／短影片／文章介紹) <span className="text-orange-600">* (必填)</span>
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={foodUrl}
                onChange={(e) => setFoodUrl(e.target.value)}
                placeholder="https://... 貼上食記分享網址、IG 或部落格連結"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all text-sm"
              />
              <Utensils className="w-5 h-5 text-orange-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ✨ 系統會自動從此美食連結中抓取縮圖並展示在圖卡上，複製按鈕亦會複製此美食連結。
            </p>
          </div>

          {/* Google 地圖連結 (非必填) */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 text-sm">
              Google 地圖連結 <span className="text-slate-400 font-normal">(選填，若無填寫則僅在清單顯示)</span>
            </label>
            <div className="relative">
              <input
                type="url"
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/... 或 Google Maps 連結"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all text-sm"
              />
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              💡 有填寫 Google 地圖連結時會在地圖上標記圖釘並提供導航；未填寫時地圖上不顯示圖釘。
            </p>
          </div>

          {/* 縣市 & 行政區連動 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1 text-sm">
                所在縣市 <span className="text-orange-600">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm"
              >
                {TAIWAN_LOCATIONS.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 text-sm">
                行政區 <span className="text-orange-600">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm"
              >
                {districtList.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 料理類別 */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 text-sm">
              美食料理類別
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm"
            >
              {FOOD_CATEGORIES.filter((c) => c !== '全部類別').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 推薦菜色與私房備註 */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 text-sm">
              私房推薦備註 / 必點招牌菜
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：一定要點招牌牛肉麵，小菜花干吸飽湯汁超讚！"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all text-sm font-medium"
            />
          </div>

          {/* 底部按鈕 */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-all text-sm"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black px-6 py-2.5 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 text-sm"
            >
              {submitting ? '儲存中...' : isEditing ? '確認更新' : '確認新增並儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
