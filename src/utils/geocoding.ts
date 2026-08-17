// Comprehensive Geocoding and Coordinate Resolver

const CLOUDFLARE_API_HOST = 'https://foodmap-czr.pages.dev';

function getApiUrl(path: string) {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return path;
    }
    if (window.location.hostname.includes('pages.dev')) {
      return path;
    }
  }
  return `${CLOUDFLARE_API_HOST}${path}`;
}

// 1. Direct Regex Parsing from full Google Maps URL
export function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url || !url.trim()) return null;
  const decoded = decodeURIComponent(url);

  // Pattern A: @25.0489123,121.5385123
  const atMatch = decoded.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch && atMatch[1] && atMatch[2]) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // Pattern B: !3d25.0489123!4d121.5385123 (Google embed / place details)
  const dMatch = decoded.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dMatch && dMatch[1] && dMatch[2]) {
    return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
  }

  // Pattern C: ?q=25.0489,121.5385 or ll=25.0489,121.5385
  const queryMatch = decoded.match(/[?&](?:q|ll|destination|center|loc:)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch && queryMatch[1] && queryMatch[2]) {
    return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
  }

  // Pattern D: /search/25.0489,121.5385
  const pathMatch = decoded.match(/\/(-?\d{1,2}\.\d+),(-?\d{2,3}\.\d+)/);
  if (pathMatch && pathMatch[1] && pathMatch[2]) {
    return { lat: parseFloat(pathMatch[1]), lng: parseFloat(pathMatch[2]) };
  }

  return null;
}

// 2. Resolve Google Shortlink via Backend API /api/resolve-maps
export async function resolveGoogleMapsShortlink(shortUrl: string): Promise<{ lat: number; lng: number } | null> {
  if (!shortUrl || !shortUrl.trim()) return null;

  try {
    const res = await fetch(getApiUrl(`/api/resolve-maps?url=${encodeURIComponent(shortUrl.trim())}`));
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        return { lat: data.latitude, lng: data.longitude };
      }
    }
  } catch {
    // Backend resolver offline
  }
  return null;
}

// 3. High-precision Geocoding using OpenStreetMap Nominatim
export async function geocodePlace(name: string, city: string, district: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const queries = [
      `${city} ${district} ${name}`,
      `${name} ${city}`,
      `${name} 台灣`,
    ];

    for (const q of queries) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=tw&limit=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'zh-TW,zh;q=0.9',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
        }
      }
    }
  } catch (err) {
    console.warn('Geocoding query error:', err);
  }

  return null;
}
