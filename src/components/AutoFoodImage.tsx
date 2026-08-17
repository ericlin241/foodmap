import React, { useState } from 'react';
import { Place } from '../types';
import { fetchLinkThumbnail } from '../utils/linkPreview';

interface AutoFoodImageProps {
  place: Place;
  className?: string;
}

export const AutoFoodImage: React.FC<AutoFoodImageProps> = ({ place, className }) => {
  const defaultImg =
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';

  const [imgSrc, setImgSrc] = useState<string>(place.image_url || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  // If no image_url or image failed to load, automatically fetch from food_url in real-time
  React.useEffect(() => {
    let isMounted = true;

    async function loadRealThumbnail() {
      if (place.image_url && !place.image_url.includes('unsplash.com')) {
        setImgSrc(place.image_url);
        return;
      }

      if (place.food_url) {
        setLoading(true);
        try {
          const realThumb = await fetchLinkThumbnail(place.food_url, place.category || '經典小吃');
          if (isMounted && realThumb) {
            setImgSrc(realThumb);
          }
        } catch {
          if (isMounted) setImgSrc(place.image_url || defaultImg);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        setImgSrc(place.image_url || defaultImg);
      }
    }

    loadRealThumbnail();

    return () => {
      isMounted = false;
    };
  }, [place.food_url, place.image_url, place.category]);

  const handleImageError = () => {
    if (!failed && place.food_url) {
      setFailed(true);
      // Try fetching link thumbnail on image error
      fetchLinkThumbnail(place.food_url, place.category || '經典小吃').then((thumb) => {
        if (thumb && thumb !== imgSrc) {
          setImgSrc(thumb);
        } else {
          setImgSrc(defaultImg);
        }
      });
    } else {
      setImgSrc(defaultImg);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-100 flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center z-10">
          <span className="text-[10px] text-slate-500 font-semibold">讀取縮圖中...</span>
        </div>
      )}
      <img
        src={imgSrc || defaultImg}
        alt={place.name}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-all duration-300 ${className || ''}`}
        loading="lazy"
      />
    </div>
  );
};
