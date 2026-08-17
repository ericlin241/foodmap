import { useState, useEffect, useCallback } from 'react';
import { Place } from '../types';

const STORAGE_KEY = 'foodmap_places_v2_clean';

// Global Cloudflare D1 Serverless API Base URL
// Ensures all devices (GitHub Pages, custom domains, mobile) sync to the exact same Cloudflare D1 database in real-time
const CLOUDFLARE_API_HOST = 'https://foodmap-czr.pages.dev';

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isD1Connected, setIsD1Connected] = useState(false);

  // Helper to determine API URL based on environment
  const getApiUrl = (path: string) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return path; // Use local Vite proxy
    }
    if (window.location.hostname.includes('pages.dev')) {
      return path; // Same-origin Cloudflare Pages
    }
    // GitHub Pages or external device -> point directly to Cloudflare D1 API host
    return `${CLOUDFLARE_API_HOST}${path}`;
  };

  // Fetch places in real-time from Cloudflare D1
  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(getApiUrl('/api/places'), {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setPlaces(data);
          setIsD1Connected(true);
          setLoading(false);
          // Sync to local backup
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          } catch {}
          return;
        }
      }
    } catch {
      // D1 API call failed
    }

    // Fallback: LocalStorage
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        setPlaces(JSON.parse(cached));
      } else {
        setPlaces([]);
      }
      setIsD1Connected(false);
    } catch (e) {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  // Add Place (Synchronously writes to Cloudflare D1)
  const addPlace = async (newPlaceData: Omit<Place, 'id' | 'created_at'>) => {
    const newPlace: Place = {
      ...newPlaceData,
      id: 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
    };

    let savedToD1 = false;
    try {
      const res = await fetch(getApiUrl('/api/places'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlace),
      });
      if (res.ok) {
        savedToD1 = true;
        setIsD1Connected(true);
      }
    } catch {
      savedToD1 = false;
    }

    // Update local state and backup
    setPlaces((prev) => {
      const updated = [newPlace, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    return { success: true, savedToD1 };
  };

  // Update Place (Edit)
  const updatePlace = async (updatedPlace: Place) => {
    let savedToD1 = false;
    try {
      const res = await fetch(getApiUrl('/api/places'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlace),
      });
      if (res.ok) {
        savedToD1 = true;
        setIsD1Connected(true);
      }
    } catch {
      savedToD1 = false;
    }

    setPlaces((prev) => {
      const updated = prev.map((p) => (p.id === updatedPlace.id ? updatedPlace : p));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    return { success: true, savedToD1 };
  };

  // Delete Place
  const deletePlace = async (id: string) => {
    try {
      await fetch(getApiUrl(`/api/places?id=${encodeURIComponent(id)}`), {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }

    setPlaces((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return {
    places,
    loading,
    error,
    isD1Connected,
    fetchPlaces,
    addPlace,
    updatePlace,
    deletePlace,
  };
}
