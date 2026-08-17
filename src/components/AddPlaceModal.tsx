import React, { useState, useEffect } from 'react';
import { X, MapPin, AlertCircle, Utensils, Check, Edit2, Sparkles } from 'lucide-react';
import { Place } from '../types';
import { TAIWAN_LOCATIONS, FOOD_CATEGORIES } from '../data/taiwanDistricts';
import {
  extractCoordsFromUrl,
  extractPlaceNameFromUrl,
  cleanAndValidatePlaceName,
  resolveGoogleMapsShortlink,
  geocodePlace,
  parseAddressToCityDistrict,
  reverseGeocodeCityDistrict,
} from '../utils/geocoding';
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

  // Real-time coordinates, auto store name & auto location detection
  const [customLat, setCustomLat] = useState<string>('');
  const [customLng, setCustomLng] = useState<string>('');
  const [showCoordInput, setShowCoordInput] = useState(false);
  const [resolvingMap, setResolvingMap] = useState(false);
  const [coordSuccessMsg, setCoordSuccessMsg] = useState<string | null>(null);
  const [coordWarnMsg, setCoordWarnMsg] = useState<string | null>(null);
  const [autoDetectedLoc, setAutoDetectedLoc] = useState<string | null>(null);
  const [autoDetectedName, setAutoDetectedName] = useState<string | null>(null);

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
      if (
        initialData.latitude !== null &&
        initialData.longitude !== null &&
        initialData.latitude !== undefined &&
        initialData.longitude !== undefined &&
        !isNaN(Number(initialData.latitude)) &&
        !isNaN(Number(initialData.longitude))
      ) {
        setCustomLat(String(initialData.latitude));
        setCustomLng(String(initialData.longitude));
        setCoordSuccessMsg(`已設定店家圖釘座標 (${Number(initialData.latitude).toFixed(5)}, ${Number(initialData.longitude).toFixed(5)})`);
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
    setCoordWarnMsg(null);
    setAutoDetectedLoc(null);
    setAutoDetectedName(null);
    setShowCoordInput(false);
  }, [initialData, isOpen]);

  // Trigger coordinate resolution and auto-detect name/city/district when Map URL changes
  const autoResolveCoordinates = async (rawUrlStr: string, currentName: string, currentCity: string, currentDist: string) => {
    if (!rawUrlStr.trim()) {
      setCustomLat('');
      setCustomLng('');
      setCoordSuccessMsg(null);
      setCoordWarnMsg(null);
      setAutoDetectedLoc(null);
      setAutoDetectedName(null);
      return;
    }

    setResolvingMap(true);
    setCoordSuccessMsg(null);
    setCoordWarnMsg(null);

    // Extract clean URL from raw text
    const urlMatch = rawUrlStr.match(/https?:\/\/[^\s"'<>]+/i);
    const cleanUrl = urlMatch ? urlMatch[0] : rawUrlStr.trim();

    // Helper to auto-fill store name, city & district
    const applyLocationDetection = async (
      latNum: number,
      lngNum: number,
      rawAddrText?: string,
      sourceName?: string,
      detectedStoreName?: string
    ) => {
      // Auto-fill Store Name if currently empty and valid
      const cleanName = cleanAndValidatePlaceName(detectedStoreName);
      if (cleanName && !name.trim()) {
        setName(cleanName);
        setAutoDetectedName(cleanName);
      }

      let detected: { city: string; district: string } | null = null;

      // 1. Try parsing address text if available
      if (rawAddrText) {
        detected = parseAddressToCityDistrict(rawAddrText);
      }
      if (!detected && rawUrlStr) {
        detected = parseAddressToCityDistrict(rawUrlStr);
      }

      // 2. Reverse geocode from coordinates
      if (!detected) {
        detected = await reverseGeocodeCityDistrict(latNum, lngNum);
      }

      if (detected) {
        setCity(detected.city);
        setDistrict(detected.district);
        setAutoDetectedLoc(`${detected.city} ${detected.district}`);
        setCoordSuccessMsg(
          `已自動帶入：${detected.city} ${detected.district} (${latNum.toFixed(5)}, ${lngNum.toFixed(5)})`
        );
      } else {
        setCoordSuccessMsg(`已取得圖釘座標 (${latNum.toFixed(5)}, ${lngNum.toFixed(5)}) [${sourceName || '網址提取'}]`);
      }
    };

    // 1. Direct Regex from URL / Raw Coordinates
    const directCoords = extractCoordsFromUrl(cleanUrl);
    if (directCoords) {
      setCustomLat(String(directCoords.lat));
      setCustomLng(String(directCoords.lng));
      await applyLocationDetection(
        directCoords.lat,
        directCoords.lng,
        undefined,
        directCoords.source,
        directCoords.name
      );
      setResolvingMap(false);
      return;
    }

    // 2. Server-side deep resolver (Follows redirects, parses HTML /preview/place pb & exact place pins)
    const resolved = await resolveGoogleMapsShortlink(cleanUrl);
    if (resolved && resolved.lat && resolved.lng) {
      setCustomLat(String(resolved.lat));
      setCustomLng(String(resolved.lng));
      await applyLocationDetection(
        resolved.lat,
        resolved.lng,
        resolved.address,
        resolved.source,
        resolved.name
      );
      setResolvingMap(false);
      return;
    }

    // 3. High-precision Geocoding fallback by Store Name
    if (currentName.trim()) {
      const geo = await geocodePlace(currentName.trim(), currentCity, currentDist);
      if (geo) {
        setCustomLat(String(geo.lat));
        setCustomLng(String(geo.lng));
        await applyLocationDetection(geo.lat, geo.lng, undefined, '店家精準定位');
        setResolvingMap(false);
        return;
      }
    }

    // Never fallback to district center! Leave coordinates empty and inform user
    setCustomLat('');
    setCustomLng('');
    setAutoDetectedLoc(null);
    setCoordWarnMsg('未能自動讀取精確圖釘座標，可手動點選縣市行政區或自訂經緯度');
    setResolvingMap(false);
  };

  const handleMapUrlChange = (newUrl: string) => {
    setMapUrl(newUrl);

    // Instant client-side place name extraction from URL if name is currently empty
    const instantName = extractPlaceNameFromUrl(newUrl);
    if (instantName && !name.trim()) {
      setName(instantName);
      setAutoDetectedName(instantName);
    }

    autoResolveCoordinates(newUrl, instantName || name, city, district);
  };

  // When city changes manually, update district default
  const handleCityChange = (cityName: string) => {
    setCity(cityName);
    setAutoDetectedLoc(null);
    const cityData = TAIWAN_LOCATIONS.find((c) => c.city === cityName);
    if (cityData && cityData.districts.length > 0) {
      const newDist = cityData.districts[0].name;
      setDistrict(newDist);
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    setAutoDetectedLoc(null);
  };

  // Live Fetch OpenGraph Thumbnail from Food URL
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

    if (customLat && customLng && !isNaN(Number(customLat)) && !isNaN(Number(customLng))) {
      finalLat = Number(customLat);
      finalLng = Number(customLng);
    } else if (mapUrl.trim()) {
      const direct = extractCoordsFromUrl(mapUrl.trim());
      if (direct) {
        finalLat = direct.lat;
        finalLng = direct.lng;
      } else {
        const resolved = await resolveGoogleMapsShortlink(mapUrl.trim());
        if (resolved && resolved.lat && resolved.lng) {
          finalLat = resolved.lat;
          finalLng = resolved.lng;
        } else {
          const geo = await geocodePlace(name.trim(), city, district);
          if (geo) {
            finalLat = geo.lat;
            finalLng = geo.lng;
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

          {/* Google 地圖連結 (最上方或選填，貼上後自動帶入店名、縣市、行政區與座標) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-800 text-sm">
                Google 地圖連結 <span className="text-orange-600 font-medium">(貼上自動帶入店名、縣市、行政區)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCoordInput(!showCoordInput)}
                className="text-[11px] text-slate-500 hover:text-orange-600 flex items-center gap-1 font-medium transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>{showCoordInput ? '隱藏座標' : '進階座標'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                id="input-modal-map-url"
                value={mapUrl}
                onChange={(e) => handleMapUrlChange(e.target.value)}
                placeholder="https://maps.app.goo.gl/... 貼上地圖連結自動帶入店名與地點"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all text-sm"
              />
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* 即時解析狀態 */}
            {resolvingMap && (
              <p className="text-[11px] text-orange-600 font-semibold mt-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                正在自動解析 Google 地圖店家名稱、座標與行政區域...
              </p>
            )}
            {coordSuccessMsg && !resolvingMap && (
              <p className="text-[11px] text-green-700 font-bold mt-1.5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
                {coordSuccessMsg}
              </p>
            )}
            {coordWarnMsg && !resolvingMap && (
              <p className="text-[11px] text-amber-700 font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 stroke-[2]" />
                {coordWarnMsg}
              </p>
            )}

            {/* 手動輸入 / 檢視經緯度 */}
            {showCoordInput && (
              <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-2 animate-in fade-in duration-150">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">緯度 (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={customLat}
                    onChange={(e) => {
                      setCustomLat(e.target.value);
                      if (e.target.value && customLng) {
                        setCoordSuccessMsg(`自訂座標 (${Number(e.target.value).toFixed(5)}, ${Number(customLng).toFixed(5)})`);
                      }
                    }}
                    placeholder="25.03396"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">經度 (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={customLng}
                    onChange={(e) => {
                      setCustomLng(e.target.value);
                      if (customLat && e.target.value) {
                        setCoordSuccessMsg(`自訂座標 (${Number(customLat).toFixed(5)}, ${Number(e.target.value).toFixed(5)})`);
                      }
                    }}
                    placeholder="121.56447"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 店家名稱 (支援 Google 地圖自動帶入) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-800 text-sm">
                店名 / 美食名稱 <span className="text-orange-600">*</span>
              </label>
              {autoDetectedName && (
                <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-green-600" />
                  自動帶入
                </span>
              )}
            </div>
            <input
              type="text"
              id="input-modal-name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setAutoDetectedName(null);
                if (mapUrl.trim()) {
                  autoResolveCoordinates(mapUrl, e.target.value, city, district);
                }
              }}
              placeholder="例：阿堂鹹粥、林東芳牛肉麵"
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all text-sm font-semibold ${
                autoDetectedName ? 'border-green-400 bg-green-50/20' : 'border-slate-300'
              }`}
            />
          </div>

          {/* 美食連結 */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 text-sm">
              美食連結 (食記／IG／短影片／文章介紹) <span className="text-orange-600">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                id="input-modal-food-url"
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

          {/* 縣市 & 行政區連動 (支援 Google 地圖自動偵測帶入，亦可手動點選) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-800 text-sm">
                  所在縣市 <span className="text-orange-600">*</span>
                </label>
                {autoDetectedLoc && (
                  <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-green-600" />
                    自動帶入
                  </span>
                )}
              </div>
              <select
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm transition-all ${
                  autoDetectedLoc ? 'border-green-400 bg-green-50/20' : 'border-slate-300'
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
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-800 text-sm">
                  行政區 <span className="text-orange-600">*</span>
                </label>
                {autoDetectedLoc && (
                  <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-green-600" />
                    自動帶入
                  </span>
                )}
              </div>
              <select
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm transition-all ${
                  autoDetectedLoc ? 'border-green-400 bg-green-50/20' : 'border-slate-300'
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
