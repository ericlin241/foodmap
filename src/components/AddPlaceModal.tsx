import React, { useState, useEffect } from 'react';
import { X, MapPin, AlertCircle, Utensils, Check } from 'lucide-react';
import { Place } from '../types';
import { TAIWAN_LOCATIONS, FOOD_CATEGORIES } from '../data/taiwanDistricts';
import { extractCoordsFromUrl, resolveGoogleMapsShortlink, geocodePlace } from '../utils/geocoding';
import { fetchLinkThumbnail } from '../utils/linkPreview';

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

  // Real-time coordinates
  const [customLat, setCustomLat] = useState<string>('');
  const [customLng, setCustomLng] = useState<string>('');
  const [showCoordInput, setShowCoordInput] = useState(false);
  const [resolvingMap, setResolvingMap] = useState(false);
  const [coordSuccessMsg, setCoordSuccessMsg] = useState<string | null>(null);

  // Real-time thumbnail preview
  const [previewImage, setPreviewImage] = useState<string>('');
  const [fetchingImage, setFetchingImage] = useState(false);

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
      setPreviewImage(initialData.image_url || '');
      if (initialData.latitude !== null && initialData.longitude !== null && initialData.latitude !== undefined && initialData.longitude !== undefined) {
        setCustomLat(String(initialData.latitude));
        setCustomLng(String(initialData.longitude));
        setCoordSuccessMsg(`已設定精確座標 (${Number(initialData.latitude).toFixed(5)}, ${Number(initialData.longitude).toFixed(5)})`);
      } else {
        setCustomLat('');
        setCustomLng('');
        setCoordSuccessMsg(null);
      }
    } else {
      setName('');
      setFoodUrl('');
      setMapUrl('');
      setCity('台北市');
      setDistrict('中正區');
      setCategory('經典小吃');
      setNote('');
      setPreviewImage('');
      setCustomLat('');
      setCustomLng('');
      setCoordSuccessMsg(null);
    }
    setError(null);
    setShowCoordInput(false);
  }, [initialData, isOpen]);

  // Trigger coordinate resolution when Map URL or Name/City/District changes
  const autoResolveCoordinates = async (urlStr: string, storeName: string, cityName: string, distName: string) => {
    if (!urlStr.trim()) {
      setCoordSuccessMsg(null);
      return;
    }

    setResolvingMap(true);
    setCoordSuccessMsg(null);

    // 1. Direct Regex from URL
    const directCoords = extractCoordsFromUrl(urlStr.trim());
    if (directCoords) {
      setCustomLat(String(directCoords.lat));
      setCustomLng(String(directCoords.lng));
      setCoordSuccessMsg(`網址精準提取 (${directCoords.lat.toFixed(5)}, ${directCoords.lng.toFixed(5)})`);
      setResolvingMap(false);
      return;
    }

    // 2. Shortlink resolver backend
    if (urlStr.includes('goo.gl') || urlStr.includes('maps.app')) {
      const resolved = await resolveGoogleMapsShortlink(urlStr.trim());
      if (resolved) {
        setCustomLat(String(resolved.lat));
        setCustomLng(String(resolved.lng));
        setCoordSuccessMsg(`短網址解析成功 (${resolved.lat.toFixed(5)}, ${resolved.lng.toFixed(5)})`);
        setResolvingMap(false);
        return;
      }
    }

    // 3. High-precision Geocoding
    if (storeName.trim()) {
      const geo = await geocodePlace(storeName.trim(), cityName, distName);
      if (geo) {
        setCustomLat(String(geo.lat));
        setCustomLng(String(geo.lng));
        setCoordSuccessMsg(`店家精準定位 (${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)})`);
        setResolvingMap(false);
        return;
      }
    }

    // 4. Fallback to district center
    const cityData = TAIWAN_LOCATIONS.find((c) => c.city === cityName);
    const distData = cityData?.districts.find((d) => d.name === distName);
    const fallbackLat = distData?.lat || cityData?.lat || 25.0375;
    const fallbackLng = distData?.lng || cityData?.lng || 121.5637;
    setCustomLat(String(fallbackLat));
    setCustomLng(String(fallbackLng));
    setCoordSuccessMsg(`已對齊行政區中心 (${fallbackLat.toFixed(4)}, ${fallbackLng.toFixed(4)})`);
    setResolvingMap(false);
  };

  const handleMapUrlChange = (newUrl: string) => {
    setMapUrl(newUrl);
    autoResolveCoordinates(newUrl, name, city, district);
  };

  // When city changes, update district default
  const handleCityChange = (cityName: string) => {
    setCity(cityName);
    const cityData = TAIWAN_LOCATIONS.find((c) => c.city === cityName);
    if (cityData && cityData.districts.length > 0) {
      const newDist = cityData.districts[0].name;
      setDistrict(newDist);
      if (mapUrl.trim()) {
        autoResolveCoordinates(mapUrl, name, cityName, newDist);
      }
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    if (mapUrl.trim()) {
      autoResolveCoordinates(mapUrl, name, city, newDist);
    }
  };

  // Live Fetch OpenGraph Thumbnail from Food URL (Linklook style)
  const handleFoodUrlChange = async (urlStr: string, cat: string) => {
    setFoodUrl(urlStr);
    if (!urlStr.trim()) {
      setPreviewImage('');
      return;
    }

    setFetchingImage(true);
    try {
      const img = await fetchLinkThumbnail(urlStr.trim(), cat);
      setPreviewImage(img);
    } catch {
      // Fallback handled inside fetchLinkThumbnail
    } finally {
      setFetchingImage(false);
    }
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

    setSubmitting(true);
    setError(null);

    let finalLat: number | null = null;
    let finalLng: number | null = null;

    if (mapUrl.trim()) {
      if (customLat && customLng && !isNaN(Number(customLat)) && !isNaN(Number(customLng))) {
        finalLat = Number(customLat);
        finalLng = Number(customLng);
      } else {
        const direct = extractCoordsFromUrl(mapUrl.trim());
        if (direct) {
          finalLat = direct.lat;
          finalLng = direct.lng;
        } else {
          const resolved = await resolveGoogleMapsShortlink(mapUrl.trim());
          if (resolved) {
            finalLat = resolved.lat;
            finalLng = resolved.lng;
          } else {
            const geo = await geocodePlace(name.trim(), city, district);
            if (geo) {
              finalLat = geo.lat;
              finalLng = geo.lng;
            } else {
              const cityData = TAIWAN_LOCATIONS.find((c) => c.city === city);
              const distData = cityData?.districts.find((d) => d.name === district);
              finalLat = distData?.lat || cityData?.lat || 25.0375;
              finalLng = distData?.lng || cityData?.lng || 121.5637;
            }
          }
        }
      }
    }

    // Extract OpenGraph / Linklook thumbnail
    let finalImageUrl = previewImage;
    if (!finalImageUrl) {
      finalImageUrl = await fetchLinkThumbnail(foodUrl.trim(), category);
    }

    try {
      if (isEditing && initialData) {
        await onSavePlace({
          ...initialData,
          name: name.trim(),
          food_url: foodUrl.trim(),
          map_url: mapUrl.trim(),
          image_url: finalImageUrl,
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
          image_url: finalImageUrl,
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
              onChange={(e) => {
                setName(e.target.value);
                if (mapUrl.trim()) {
                  autoResolveCoordinates(mapUrl, e.target.value, city, district);
                }
              }}
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
                onChange={(e) => handleFoodUrlChange(e.target.value, category)}
                placeholder="https://... 貼上食記分享網址、IG 或部落格連結"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all text-sm"
              />
              <Utensils className="w-5 h-5 text-orange-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* 抓取美食連結縮圖狀態與即時預覽 */}
            {fetchingImage && (
              <p className="text-[11px] text-orange-600 font-semibold mt-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                正在自動解析網址縮圖 (OpenGraph / IG / 文章預覽)...
              </p>
            )}

            {previewImage && !fetchingImage && (
              <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <img
                  src={previewImage}
                  alt="美食縮圖預覽"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-sm"
                  onError={() => setPreviewImage('')}
                />
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
                    已成功讀取美食網址縮圖
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">將直接顯示於地圖圖卡與美食清單上</p>
                </div>
              </div>
            )}
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
                onChange={(e) => handleMapUrlChange(e.target.value)}
                placeholder="https://maps.app.goo.gl/... 或 Google Maps 連結"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all text-sm"
              />
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* 即時解析狀態 */}
            {resolvingMap && (
              <p className="text-[11px] text-orange-600 font-semibold mt-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                正在自動定位 Google 地圖店家精準座標...
              </p>
            )}
            {coordSuccessMsg && !resolvingMap && (
              <p className="text-[11px] text-green-700 font-bold mt-1.5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
                {coordSuccessMsg}
              </p>
            )}
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
                onChange={(e) => handleDistrictChange(e.target.value)}
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
