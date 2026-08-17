// OpenGraph / Link Preview Fetcher & Thumbnail Extractor (Linklook style)

export interface LinkMetadata {
  image?: string;
  title?: string;
  description?: string;
}

/**
 * Fetch actual thumbnail from food URL (OpenGraph og:image, YouTube, or direct image)
 * Returns empty string if no valid thumbnail is found (NO placeholder / fallback images)
 */
export async function fetchLinkThumbnail(url: string, _category: string = ''): Promise<string> {
  if (!url || !url.trim()) return '';

  const trimmed = url.trim();

  // 1. Direct Image URL
  if (/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(trimmed)) {
    return trimmed;
  }

  // 2. YouTube Video / Shorts Thumbnail
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  // 3. Try Cloudflare Pages / Vite server /api/preview endpoint
  try {
    const res = await fetch(`/api/preview?url=${encodeURIComponent(trimmed)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.image) {
        return data.image;
      }
    }
  } catch {
    // API endpoint unreachable
  }

  // 4. Try Public CORS OpenGraph Resolver (Microlink / Linklook format)
  try {
    const microRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(trimmed)}`);
    if (microRes.ok) {
      const microData = await microRes.json();
      if (microData.status === 'success' && microData.data?.image?.url) {
        return microData.data.image.url;
      }
    }
  } catch {
    // Silent
  }

  // Absolutely NO fallback images - return empty string if thumbnail cannot be read
  return '';
}
