export interface Place {
  id: string;
  name: string;
  url?: string;
  image_url?: string;
  city: string;
  district: string;
  category?: string;
  note?: string;
  latitude: number;
  longitude: number;
  rating?: number;
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
