// Geocoding and Coordinate Resolver for Taiwan Addresses and Google Maps URLs

// 1. Direct Regex Parsing from full Google Maps URL
export function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url || !url.trim()) return null;
  const decoded = decodeURIComponent(url);

  // Pattern A: @25.0489,121.5385
  const atMatch = decoded.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch && atMatch[1] && atMatch[2]) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // Pattern B: !3d25.0489!4d121.5385 (Google embed / place details)
  const dMatch = decoded.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dMatch && dMatch[1] && dMatch[2]) {
    return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
  }

  // Pattern C: ?q=25.0489,121.5385 or ll=25.0489,121.5385 or destination=25.0489,121.5385
  const queryMatch = decoded.match(/[?&](?:q|ll|destination|center|loc:)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch && queryMatch[1] && queryMatch[2]) {
    return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
  }

  // Pattern D: coordinates in path /search/25.0489,121.5385
  const pathMatch = decoded.match(/\/(-?\d{1,2}\.\d+),(-?\d{2,3}\.\d+)/);
  if (pathMatch && pathMatch[1] && pathMatch[2]) {
    return { lat: parseFloat(pathMatch[1]), lng: parseFloat(pathMatch[2]) };
  }

  return null;
}

// 2. High-precision Geocoding using OpenStreetMap Nominatim (Free, No Key, Accurate)
export async function geocodePlace(name: string, city: string, district: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Try query 1: "台北市 中山區 林東芳牛肉麵"
    const query1 = `${city} ${district} ${name}`;
    const res1 = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query1)}&limit=1`,
      { headers: { 'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8' } }
    );
    if (res1.ok) {
      const data1 = await res1.json();
      if (Array.isArray(data1) && data1.length > 0 && data1[0].lat && data1[0].lon) {
        return { lat: parseFloat(data1[0].lat), lng: parseFloat(data1[0].lon) };
      }
    }

    // Try query 2: "林東芳牛肉麵 台北市"
    const query2 = `${name} ${city}`;
    const res2 = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query2)}&limit=1`,
      { headers: { 'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8' } }
    );
    if (res2.ok) {
      const data2 = await res2.json();
      if (Array.isArray(data2) && data2.length > 0 && data2[0].lat && data2[0].lon) {
        return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) };
      }
    }
  } catch (e) {
    console.warn('Nominatim geocoding failed', e);
  }
  return null;
}
