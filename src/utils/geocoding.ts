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
 * Universal Coordinate Extractor for any Google Maps URL format:
 * - Direct place pins: !3d<lat>!4d<lng> or !2d<lng>!3d<lat>
 * - Search query parameters: ?q=lat,lng or &ll=lat,lng or &destination=lat,lng
 * - Static map centers: center=lat%2Clng
 * - Viewport camera center: @lat,lng
 */
export function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url || !url.trim()) return null;

  // 1. Exact Place Pin Coordinates: !3d<lat>!4d<lng> or encoded %213d<lat>%214d<lng>
  const dMatch = url.match(/(?:%21|!)3d(-?\d+\.\d+)(?:%21|!)4d(-?\d+\.\d+)/i);
  if (dMatch && dMatch[1] && dMatch[2]) {
    const lat = parseFloat(dMatch[1]);
    const lng = parseFloat(dMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // 2. PB parameter reverse pin: !2d<lng>!3d<lat> or encoded %212d<lng>%213d<lat>
  const pbMatch = url.match(/(?:%21|!)2d(-?\d+\.\d+)(?:%21|!)3d(-?\d+\.\d+)/i);
  if (pbMatch && pbMatch[1] && pbMatch[2]) {
    const lng = parseFloat(pbMatch[1]);
    const lat = parseFloat(pbMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // 3. Exact Query parameters: ?q=lat,lng or &ll=lat,lng or &destination=lat,lng or &loc:lat,lng
  const queryMatch = url.match(/[?&](?:q|ll|destination|loc:)=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
  if (queryMatch && queryMatch[1] && queryMatch[2]) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // 4. Staticmap / Preview center: center=lat,lng or center=lat%2Clng
  const centerMatch = url.match(/center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
  if (centerMatch && centerMatch[1] && centerMatch[2]) {
    const lat = parseFloat(centerMatch[1]);
    const lng = parseFloat(centerMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // 5. Direct path search: /search/lat,lng
  const searchMatch = url.match(/\/search\/(-?\d{1,2}\.\d+)(?:%2C|,)(-?\d{2,3}\.\d+)/i);
  if (searchMatch && searchMatch[1] && searchMatch[2]) {
    const lat = parseFloat(searchMatch[1]);
    const lng = parseFloat(searchMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // 6. Camera Viewport Center: @lat,lng
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (atMatch && atMatch[1] && atMatch[2]) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  return null;
}

// 2. High-precision Cloudflare Serverless Resolver for Shortlinks & /data= place URLs
export async function resolveGoogleMapsShortlink(targetUrl: string): Promise<{ lat: number; lng: number } | null> {
  if (!targetUrl || !targetUrl.trim()) return null;

  try {
    const res = await fetch(getApiUrl(`/api/resolve-maps?url=${encodeURIComponent(targetUrl.trim())}`));
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
