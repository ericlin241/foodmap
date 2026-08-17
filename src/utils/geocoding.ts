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

/**
 * Extract exact pin/place coordinates from Google Maps URLs.
 * Priority 1: !3d<lat>!4d<lng> (The exact place pin location)
 * Priority 2: query parameters ?q=<lat>,<lng> or &ll=<lat>,<lng>
 * Priority 3: viewport center @<lat>,<lng> (only if no pin is specified)
 */
export function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url || !url.trim()) return null;
  const decoded = decodeURIComponent(url);

  // 1. Highest Priority: Google Place Pin Exact Coordinates (!3d<lat>!4d<lng>)
  const dMatch = decoded.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dMatch && dMatch[1] && dMatch[2]) {
    const lat = parseFloat(dMatch[1]);
    const lng = parseFloat(dMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // 2. Exact Search/Destination Query: ?q=<lat>,<lng> or &ll=<lat>,<lng> or &destination=<lat>,<lng>
  const queryMatch = decoded.match(/[?&](?:q|ll|destination|loc:)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch && queryMatch[1] && queryMatch[2]) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // 3. Direct Search Path: /search/25.0489,121.5385
  const pathMatch = decoded.match(/\/search\/(-?\d{1,2}\.\d+),(-?\d{2,3}\.\d+)/);
  if (pathMatch && pathMatch[1] && pathMatch[2]) {
    const lat = parseFloat(pathMatch[1]);
    const lng = parseFloat(pathMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // 4. Viewport Camera Center: @25.0489123,121.5385123 (Fallback when no !3d!4d pin exists)
  const atMatch = decoded.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch && atMatch[1] && atMatch[2]) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
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
    const cleanName = name.replace(/（[^）]*）|\([^)]*\)/g, '').trim();
    const queries = [
      `${city} ${district} ${name}`,
      `${city} ${district} ${cleanName}`,
      `${name} ${city}`,
      `${cleanName} ${city}`,
      `${cleanName} 台灣`,
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
