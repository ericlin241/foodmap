import { useState, useEffect, useCallback } from 'react';
import { Place } from '../types';
import { INITIAL_PLACES } from '../data/initialPlaces';

const STORAGE_KEY = 'foodmap_places_v2_clean';

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isD1Connected, setIsD1Connected] = useState(false);

  // Fetch places
  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/places');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setPlaces(data);
          setIsD1Connected(true);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Backend not running
    }

    // Fallback: LocalStorage
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        setPlaces(JSON.parse(cached));
      } else {
        setPlaces([]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }
      setIsD1Connected(false);
    } catch (e) {
      console.error('LocalStorage failed', e);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  // Add Place
  const addPlace = async (newPlaceData: Omit<Place, 'id' | 'created_at'>) => {
    const newPlace: Place = {
      ...newPlaceData,
      id: 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toLocaleString('zh-TW', { hour12: false }),
    };

    // Try API
    let savedToD1 = false;
    try {
      const res = await fetch('/api/places', {
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

    // Update local state and localStorage
    setPlaces((prev) => {
      const updated = [newPlace, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return { success: true, savedToD1 };
  };

  // Update Place (Edit)
  const updatePlace = async (updatedPlace: Place) => {
    let savedToD1 = false;
    try {
      const res = await fetch('/api/places', {
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return { success: true, savedToD1 };
  };

  // Delete Place
  const deletePlace = async (id: string) => {
    try {
      await fetch(`/api/places?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }

    setPlaces((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Reset to initial demo data
  const resetToSampleData = () => {
    setPlaces(INITIAL_PLACES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PLACES));
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
    resetToSampleData,
  };
}
