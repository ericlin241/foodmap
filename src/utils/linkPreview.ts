// OpenGraph / Link Preview Fetcher & Thumbnail Extractor (Linklook style)

export interface LinkMetadata {
  image?: string;
  title?: string;
  description?: string;
}

// Category Curated Fallbacks if website has no OG Image
const CATEGORY_FALLBACKS: { [key: string]: string } = {
  '經典小吃': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80',
  '傳統麵食': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
  '海鮮熱炒': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
  '火鍋鍋物': 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=800&auto=format&fit=crop&q=80',
  '早午餐/豆漿': 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80',
  '甜品冰品': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
  '咖啡茶飲': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
  '夜市必吃': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
  '家庭聚餐': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
  '其他': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
};

/**
 * Fetch actual thumbnail from food URL (OpenGraph og:image, YouTube, or direct image)
 */
export async function fetchLinkThumbnail(url: string, category: string = '經典小吃'): Promise<string> {
  if (!url || !url.trim()) return CATEGORY_FALLBACKS[category] || CATEGORY_FALLBACKS['經典小吃'];

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

  // 3. Try Cloudflare Pages /api/preview endpoint
  try {
    const res = await fetch(`/api/preview?url=${encodeURIComponent(trimmed)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.image) {
        return data.image;
      }
    }
  } catch {
    // Local environment without API
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
    // Silent fallback
  }

  return CATEGORY_FALLBACKS[category] || CATEGORY_FALLBACKS['經典小吃'];
}
