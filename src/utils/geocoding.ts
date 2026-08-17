// Comprehensive Geocoding, Coordinate Resolver, and Auto City/District/Name Detector
import { TAIWAN_LOCATIONS } from '../data/taiwanDistricts';

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
 * Clean and strictly validate place name (never return raw coords, data= params, hex CID, or internal tokens)
 */
export function cleanAndValidatePlaceName(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let str = raw.trim();

  // Multi-pass safe URL decoding
  for (let i = 0; i < 3; i++) {
    if (/%[0-9a-fA-F]{2}/.test(str)) {
      try {
        str = decodeURIComponent(str);
      } catch {
        break;
      }
    } else {
      break;
    }
  }

  // Remove trailing query params or hash
  str = str.replace(/[?#].*$/, '');
  // Remove trailing @lat,lng coordinates if appended
  str = str.replace(/@[-0-9.,]+.*$/, '');
  // Remove data= or !3m parameters if present
  str = str.replace(/\/data=.*$/, '');
  str = str.replace(/\+/g, ' ').trim();

  // Filter out invalid names / internal tokens / garbled fragments
  if (!str) return null;
  if (/^data=!/i.test(str)) return null;
  if (/^!/i.test(str)) return null;
  if (/^0x[0-9a-f]+:0x[0-9a-f]+$/i.test(str)) return null;
  if (/^0x[0-9a-f]+$/i.test(str)) return null;
  if (/^ChIJ[a-zA-Z0-9_-]+$/i.test(str)) return null;
  if (/^-?\d{1,2}\.\d+,-?\d{2,3}\.\d+$/.test(str)) return null;
  if (/^(maps|preview|search|place|dir|viewer|timeline|sorry|consent)$/i.test(str)) return null;
  if (str.length < 1 || str.length > 80) return null;

  return str;
}

/**
 * Extract Place/Store Name from Google Maps URL
 */
export function extractPlaceNameFromUrl(rawInput: string): string | null {
  if (!rawInput || !rawInput.trim()) return null;

  try {
    let decoded = rawInput.trim();
    for (let i = 0; i < 3; i++) {
      if (/%[0-9a-fA-F]{2}/.test(decoded)) {
        try {
          decoded = decodeURIComponent(decoded);
        } catch {
          break;
        }
      } else {
        break;
      }
    }

    // 1. /maps/place/<Name>
    const placeMatch = decoded.match(/\/maps\/place\/([^\/@?#]+)/i);
    if (placeMatch && placeMatch[1]) {
      const valid = cleanAndValidatePlaceName(placeMatch[1]);
      if (valid) return valid;
    }

    // 2. /maps/search/<Name>
    const searchMatch = decoded.match(/\/maps\/search\/([^\/@?#]+)/i);
    if (searchMatch && searchMatch[1]) {
      const valid = cleanAndValidatePlaceName(searchMatch[1]);
      if (valid) return valid;
    }

    // 3. Query param ?q=<Name> or ?query=<Name>
    const qMatch = decoded.match(/[?&](?:q|query)=([^&]+)/i);
    if (qMatch && qMatch[1]) {
      const valid = cleanAndValidatePlaceName(qMatch[1]);
      if (valid) {
        const parts = valid.split(/\s+/);
        return parts[0] || valid;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Universal Coordinate Extractor for any Google Maps URL format:
 * - Direct place pins: !3d<lat>!4d<lng> or !2d<lng>!3d<lat>
 * - Search query parameters: ?q=lat,lng or &ll=lat,lng or &destination=lat,lng or &daddr=lat,lng
 * - Static map centers: center=lat%2Clng
 * - Direct coordinates: lat, lng
 * - Viewport camera center: @lat,lng
 */
export function extractCoordsFromUrl(rawInput: string): { lat: number; lng: number; source?: string; name?: string } | null {
  if (!rawInput || !rawInput.trim()) return null;

  // Extract clean URL or coordinates from text
  const urlMatch = rawInput.match(/https?:\/\/[^\s"'<>]+/i);
  const target = urlMatch ? urlMatch[0] : rawInput.trim();
  const extractedName = extractPlaceNameFromUrl(target) || extractPlaceNameFromUrl(rawInput) || undefined;

  // 0. Direct coordinates "lat, lng" or "lat,lng"
  const rawCoordMatch = target.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{2,3}\.\d+)$/);
  if (rawCoordMatch) {
    const lat = parseFloat(rawCoordMatch[1]);
    const lng = parseFloat(rawCoordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, source: '自訂座標', name: extractedName };
  }

  // 1. Exact Place Pin Coordinates: !3d<lat>!4d<lng> or encoded %213d<lat>%214d<lng>
  const dMatch = target.match(/(?:%21|!)3d(-?\d+\.\d+)(?:%21|!)4d(-?\d+\.\d+)/i);
  if (dMatch && dMatch[1] && dMatch[2]) {
    const lat = parseFloat(dMatch[1]);
    const lng = parseFloat(dMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, source: '地標圖釘', name: extractedName };
  }

  // 2. PB parameter reverse pin: !2d<lng>!3d<lat> or encoded %212d<lng>%213d<lat>
  const pbMatch = target.match(/(?:%21|!)2d(-?\d+\.\d+)(?:%21|!)3d(-?\d+\.\d+)/i);
  if (pbMatch && pbMatch[1] && pbMatch[2]) {
    const lng = parseFloat(pbMatch[1]);
    const lat = parseFloat(pbMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, source: '地標圖釘', name: extractedName };
  }

  // 3. Exact Query parameters: ?q=lat,lng / &ll=lat,lng / &destination=lat,lng / &loc:lat,lng / &daddr=lat,lng
  const queryMatch = target.match(/[?&](?:q|ll|destination|loc:|daddr)=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
  if (queryMatch && queryMatch[1] && queryMatch[2]) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, source: '查詢參數', name: extractedName };
  }

  // 4. Staticmap / Preview center: center=lat,lng or center=lat%2Clng
  const centerMatch = target.match(/center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
  if (centerMatch && centerMatch[1] && centerMatch[2]) {
    const lat = parseFloat(centerMatch[1]);
    const lng = parseFloat(centerMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, source: '地圖中心', name: extractedName };
  }

  // 5. Direct path search: /search/lat,lng
  const searchMatch = target.match(/\/search\/(-?\d{1,2}\.\d+)(?:%2C|,)(-?\d{2,3}\.\d+)/i);
  if (searchMatch && searchMatch[1] && searchMatch[2]) {
    const lat = parseFloat(searchMatch[1]);
    const lng = parseFloat(searchMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, source: '搜尋座標', name: extractedName };
  }

  // 6. Camera Viewport Center: @lat,lng
  const atMatch = target.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (atMatch && atMatch[1] && atMatch[2]) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, source: '視角中心', name: extractedName };
  }

  return null;
}

// 2. High-precision Cloudflare Serverless Resolver for Shortlinks & /data= place URLs
export async function resolveGoogleMapsShortlink(targetUrl: string): Promise<{ lat: number; lng: number; source?: string; address?: string; name?: string } | null> {
  if (!targetUrl || !targetUrl.trim()) return null;

  try {
    const res = await fetch(getApiUrl(`/api/resolve-maps?url=${encodeURIComponent(targetUrl.trim())}`));
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        return {
          lat: data.latitude,
          lng: data.longitude,
          source: data.source || '雲端精準解析',
          address: data.address || undefined,
          name: cleanAndValidatePlaceName(data.name) || undefined,
        };
      }
    }
  } catch {
    // Backend resolver offline
  }
  return null;
}

// 3. Match address string to Taiwan City & District
export function parseAddressToCityDistrict(addressText: string): { city: string; district: string } | null {
  if (!addressText || !addressText.trim()) return null;
  const normalized = addressText.replace(/臺/g, '台').trim();

  // Try matching City + District
  for (const c of TAIWAN_LOCATIONS) {
    const shortCity = c.city.replace('市', '').replace('縣', '');
    if (normalized.includes(c.city) || normalized.includes(shortCity)) {
      for (const d of c.districts) {
        if (normalized.includes(d.name)) {
          return { city: c.city, district: d.name };
        }
      }
    }
  }

  // Fallback: match any unique district name
  for (const c of TAIWAN_LOCATIONS) {
    for (const d of c.districts) {
      if (normalized.includes(d.name)) {
        return { city: c.city, district: d.name };
      }
    }
  }

  return null;
}

// 4. Reverse Geocode Coordinates to Taiwan City & District
export async function reverseGeocodeCityDistrict(lat: number, lng: number): Promise<{ city: string; district: string } | null> {
  if (isNaN(lat) || isNaN(lng)) return null;

  // 1. Try Nominatim Reverse Geocoding
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh-TW`,
      {
        headers: {
          'Accept-Language': 'zh-TW,zh;q=0.9',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const rawCity = (addr.city || addr.county || addr.state || '').replace(/臺/g, '台');
        const rawDist = (addr.suburb || addr.town || addr.district || addr.city_district || addr.village || '').replace(/臺/g, '台');

        for (const c of TAIWAN_LOCATIONS) {
          if (rawCity.includes(c.city) || c.city.includes(rawCity) || rawCity.includes(c.city.replace('市', '').replace('縣', ''))) {
            for (const d of c.districts) {
              if (rawDist.includes(d.name) || d.name.includes(rawDist)) {
                return { city: c.city, district: d.name };
              }
            }
          }
        }

        if (data.display_name) {
          const parsed = parseAddressToCityDistrict(data.display_name);
          if (parsed) return parsed;
        }
      }
    }
  } catch {
    // Reverse geocoding fallback
  }

  // 2. Spatial Nearest Neighbor in TAIWAN_LOCATIONS
  let minDistance = Infinity;
  let bestMatch: { city: string; district: string } | null = null;

  for (const cityData of TAIWAN_LOCATIONS) {
    for (const dist of cityData.districts) {
      const dLat = lat - dist.lat;
      const dLng = (lng - dist.lng) * 0.9135;
      const distSq = dLat * dLat + dLng * dLng;
      if (distSq < minDistance) {
        minDistance = distSq;
        bestMatch = { city: cityData.city, district: dist.name };
      }
    }
  }

  return bestMatch;
}

// 5. High-precision Geocoding by Store Name
export async function geocodePlace(name: string, city: string, district: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const cleanName = name.replace(/（[^）]*）|\([^)]*\)/g, '').trim();
    if (!cleanName) return null;

    const queries = [
      `${city} ${district} ${name}`,
      `${city} ${district} ${cleanName}`,
      `${name} ${city}`,
      `${cleanName} ${city}`,
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
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Geocoding query error:', err);
  }

  return null;
}
