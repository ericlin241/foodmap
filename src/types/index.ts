export interface Place {
  id: string;
  name: string;
  food_url: string;       // 美食分享連結 (必填，食記/IG/部落格/介紹等)
  map_url?: string;       // Google 地圖連結 (非必填)
  image_url?: string;     // 由美食連結取得或自動生成的縮圖
  city: string;
  district: string;
  category?: string;
  note?: string;
  latitude?: number | null;   // 若無 Google 地圖則為 null / undefined
  longitude?: number | null;  // 若無 Google 地圖則為 null / undefined
  created_at?: string;
}

export interface CityDistrictData {
  city: string;
  districts: {
    name: string;
    lat: number;
    lng: number;
  }[];
  lat: number;
  lng: number;
}

export type ViewMode = 'both' | 'map' | 'list';
