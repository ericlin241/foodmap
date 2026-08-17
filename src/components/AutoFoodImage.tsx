import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { fetchLinkThumbnail } from '../utils/linkPreview';
import { ImageOff } from 'lucide-react';

interface AutoFoodImageProps {
  place: Place;
  className?: string;
}

export const AutoFoodImage: React.FC<AutoFoodImageProps> = ({ place, className }) => {
  const [imgSrc, setImgSrc] = useState<string>(
    place.image_url && !place.image_url.includes('unsplash.com') ? place.image_url : ''
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRealThumbnail() {
      // If already a valid custom image URL (and not old unsplash template)
      if (place.image_url && !place.image_url.includes('unsplash.com')) {
        setImgSrc(place.image_url);
        setHasError(false);
        return;
      }

      if (place.food_url) {
        setLoading(true);
        setHasError(false);
        try {
          const realThumb = await fetchLinkThumbnail(place.food_url);
          if (isMounted) {
            if (realThumb) {
              setImgSrc(realThumb);
              setHasError(false);
            } else {
              setImgSrc('');
              setHasError(true);
            }
          }
        } catch {
          if (isMounted) {
            setImgSrc('');
            setHasError(true);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        setImgSrc('');
        setHasError(true);
      }
    }

    loadRealThumbnail();

    return () => {
      isMounted = false;
    };
  }, [place.food_url, place.image_url]);

  const handleImageError = () => {
    setImgSrc('');
    setHasError(true);
  };

  // If no image or error, render clean "無圖片" placeholder block
  if (!imgSrc || hasError) {
    return (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-2 select-none">
        <ImageOff className="w-6 h-6 mb-1 text-slate-300 stroke-[1.5]" />
        <span className="text-xs font-bold text-slate-400">無圖片</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-100 flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center z-10">
          <span className="text-[10px] text-slate-500 font-semibold">讀取縮圖中...</span>
        </div>
      )}
      <img
        src={imgSrc}
        alt={place.name}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-all duration-300 ${className || ''}`}
        loading="lazy"
      />
    </div>
  );
};
