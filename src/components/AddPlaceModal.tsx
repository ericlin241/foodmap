import React, { useState } from 'react';
import { X, MapPin, Link2, Image, FileText, CheckCircle2, Navigation, AlertCircle } from 'lucide-react';
import { Place } from '../types';
import { TAIWAN_LOCATIONS, FOOD_CATEGORIES } from '../data/taiwanDistricts';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlace: (place: Omit<Place, 'id' | 'created_at'>) => Promise<{ success: boolean; savedToD1: boolean }>;
  seniorMode: boolean;
  pickedCoords: { lat: number; lng: number } | null;
  onStartPickingLocation: () => void;
}

export const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  isOpen,
  onClose,
  onAddPlace,
  seniorMode,
  pickedCoords,
  onStartPickingLocation,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [city, setCity] = useState('台北市');
  const [district, setDistrict] = useState('中正區');
  const [category, setCategory] = useState('經典小吃');
  const [note, setNote] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [rating, setRating] = useState('5.0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update coords if user picked from map
  React.useEffect(() => {
    if (pickedCoords) {
      setLatitude(pickedCoords.lat.toFixed(6));
      setLongitude(pickedCoords.lng.toFixed(6));
    }
  }, [pickedCoords]);

  // When city changes, update district default & auto-fill rough coords if empty
  const handleCityChange = (cityName: string) => {
    setCity(cityName);
    const cityData = TAIWAN_LOCATIONS.find((c) => c.city === cityName);
    if (cityData && cityData.districts.length > 0) {
      setDistrict(cityData.districts[0].name);
      if (!latitude || !longitude || !pickedCoords) {
        setLatitude(cityData.districts[0].lat.toFixed(6));
        setLongitude(cityData.districts[0].lng.toFixed(6));
      }
    }
  };

  const handleDistrictChange = (districtName: string) => {
    setDistrict(districtName);
    const cityData = TAIWAN_LOCATIONS.find((c) => c.city === city);
    const distData = cityData?.districts.find((d) => d.name === districtName);
    if (distData && (!pickedCoords || !latitude)) {
      setLatitude(distData.lat.toFixed(6));
      setLongitude(distData.lng.toFixed(6));
    }
  };

  // Auto extract coordinates or title from Google Maps URL if available
  const handleUrlChange = (inputUrl: string) => {
    setUrl(inputUrl);

    // Try parsing @lat,lng from standard Google Maps url
    // Example: https://www.google.com/maps/place/.../@25.0489,121.5385,17z/...
    const coordMatch = inputUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch && coordMatch[1] && coordMatch[2]) {
      setLatitude(coordMatch[1]);
      setLongitude(coordMatch[2]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('請輸入店家名稱！');
      return;
    }

    // Default coordinates based on district if not specified
    let finalLat = parseFloat(latitude);
    let finalLng = parseFloat(longitude);

    if (isNaN(finalLat) || isNaN(finalLng)) {
      const cityData = TAIWAN_LOCATIONS.find((c) => c.city === city);
      const distData = cityData?.districts.find((d) => d.name === district);
      finalLat = distData?.lat || cityData?.lat || 25.0375;
      finalLng = distData?.lng || cityData?.lng || 121.5637;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onAddPlace({
        name: name.trim(),
        url: url.trim(),
        image_url:
          imageUrl.trim() ||
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
        city,
        district,
        category,
        note: note.trim(),
        latitude: finalLat,
        longitude: finalLng,
        rating: parseFloat(rating) || 5.0,
      });

      // Reset form
      setName('');
      setUrl('');
      setImageUrl('');
      setNote('');
      onClose();
    } catch (err: any) {
      setError(err.message || '新增失敗，請稍候再試！');
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
            <h2 className={`font-black tracking-tight ${seniorMode ? 'text-2xl' : 'text-xl'}`}>
              新增私房美食地點
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
            <label className={`block font-bold text-slate-800 mb-1 ${seniorMode ? 'text-lg' : 'text-sm'}`}>
              店名 / 美食名稱 <span className="text-orange-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：阿堂鹹粥、林東芳牛肉麵"
              className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all ${
                seniorMode ? 'text-lg py-3 font-semibold' : 'text-sm'
              }`}
            />
          </div>

          {/* 縣市 & 行政區連動 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block font-bold text-slate-800 mb-1 ${seniorMode ? 'text-lg' : 'text-sm'}`}>
                所在縣市 <span className="text-orange-600">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium ${
                  seniorMode ? 'text-base font-bold' : 'text-sm'
                }`}
              >
                {TAIWAN_LOCATIONS.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block font-bold text-slate-800 mb-1 ${seniorMode ? 'text-lg' : 'text-sm'}`}>
                行政區 <span className="text-orange-600">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium ${
                  seniorMode ? 'text-base font-bold' : 'text-sm'
                }`}
              >
                {districtList.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 料理類別 & 評分 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block font-bold text-slate-800 mb-1 ${seniorMode ? 'text-lg' : 'text-sm'}`}>
                美食類別
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium ${
                  seniorMode ? 'text-base font-bold' : 'text-sm'
                }`}
              >
                {FOOD_CATEGORIES.filter((c) => c !== '全部類別').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block font-bold text-slate-800 mb-1 ${seniorMode ? 'text-lg' : 'text-sm'}`}>
                長輩推薦評分
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium ${
                  seniorMode ? 'text-base font-bold' : 'text-sm'
                }`}
              >
                <option value="5.0">⭐⭐⭐⭐⭐ 5.0 (必吃極推)</option>
                <option value="4.8">⭐⭐⭐⭐ 4.8 (超棒老店)</option>
                <option value="4.5">⭐⭐⭐⭐ 4.5 (值得一試)</option>
                <option value="4.0">⭐⭐⭐⭐ 4.0 (平價好吃)</option>
              </select>
            </div>
          </div>

          {/* Google Maps 分享連結 */}
          <div>
            <label className={`block font-bold text-slate-800 mb-1 ${seniorMode ? 'text-lg' : 'text-sm'}`}>
              Google 地圖分享連結 (LINE 轉貼)
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://maps.app.goo.gl/... 或 Google Maps 網址"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all ${
                  seniorMode ? 'text-base' : 'text-sm'
                }`}
              />
              <Link2 className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* 推薦菜色與私房備註 */}
          <div>
            <label className={`block font-bold text-slate-800 mb-1 ${seniorMode ? 'text-lg' : 'text-sm'}`}>
              私房推薦備註 / 必點招牌菜
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：一定要點招牌牛肉麵，小菜花干吸飽湯汁超讚！附近好停車。"
              className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all ${
                seniorMode ? 'text-base font-medium' : 'text-sm'
              }`}
            />
          </div>

          {/* 美食照片縮圖網址 */}
          <div>
            <label className={`block font-bold text-slate-800 mb-1 ${seniorMode ? 'text-lg' : 'text-sm'}`}>
              美食照片網址 (Image URL，可留空自動套用)
            </label>
            <div className="relative">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... 美食圖片網址"
                className={`w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all ${
                  seniorMode ? 'text-base' : 'text-xs'
                }`}
              />
              <Image className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* 地理座標選取 (支援在地圖上點擊) */}
          <div className="bg-orange-50/70 p-3.5 rounded-2xl border border-orange-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-950 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-orange-600" />
                精確經緯度座標（地圖標記定位）
              </span>
              <button
                type="button"
                onClick={() => {
                  onStartPickingLocation();
                }}
                className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all"
              >
                📍 在地圖上點選位置
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">緯度 (Latitude):</span>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="自動填入"
                  className="w-full px-2.5 py-1.5 mt-0.5 bg-white border border-orange-200 rounded-lg outline-none font-mono"
                />
              </div>
              <div>
                <span className="text-slate-500">經度 (Longitude):</span>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="自動填入"
                  className="w-full px-2.5 py-1.5 mt-0.5 bg-white border border-orange-200 rounded-lg outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* 底部按鈕 */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-all ${
                seniorMode ? 'text-base py-3' : 'text-sm'
              }`}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black px-6 py-2.5 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 ${
                seniorMode ? 'text-lg py-3 px-8' : 'text-sm'
              }`}
            >
              {submitting ? '儲存中...' : '確認新增並儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
