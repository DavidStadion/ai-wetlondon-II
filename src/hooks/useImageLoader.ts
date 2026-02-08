import { useState, useEffect } from 'preact/hooks';
import type { VenueType } from '../types';

const IMAGE_CACHE_KEY = 'wet_london_images_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  url: string;
  source: 'places' | 'unsplash' | 'unknown';
  timestamp: number;
}

interface ImageCache {
  [venueName: string]: CacheEntry;
}

interface ImageLoaderState {
  src: string;
  isLoading: boolean;
  error: boolean;
}

/**
 * Hook for lazy image loading with fallbacks.
 * Checks localStorage cache first, then fetches from Google Places API.
 */
export function useImageLoader(
  venueName: string,
  venueTypes: VenueType[] = []
): ImageLoaderState {
  const placeholder = getPlaceholderImage(venueName, venueTypes);
  const [state, setState] = useState<ImageLoaderState>({
    src: placeholder,
    isLoading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Check cache first
      const cached = getCachedImage(venueName);
      if (cached) {
        if (!cancelled) {
          setState({ src: cached, isLoading: false, error: false });
        }
        return;
      }

      // Try Google Places API
      try {
        const url = await fetchPlacesImage(venueName);
        if (!cancelled) {
          if (url) {
            setState({ src: url, isLoading: false, error: false });
          } else {
            setState({ src: placeholder, isLoading: false, error: true });
          }
        }
      } catch {
        if (!cancelled) {
          setState({ src: placeholder, isLoading: false, error: true });
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [venueName]);

  return state;
}

function getImageCache(): ImageCache {
  try {
    const cache = localStorage.getItem(IMAGE_CACHE_KEY);
    return cache ? (JSON.parse(cache) as ImageCache) : {};
  } catch {
    return {};
  }
}

function setImageCache(
  venueName: string,
  imageUrl: string,
  source: CacheEntry['source'] = 'unknown'
): void {
  try {
    const cache = getImageCache();
    cache[venueName] = {
      url: imageUrl,
      source,
      timestamp: Date.now(),
    };
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore write errors
  }
}

function getCachedImage(venueName: string): string | null {
  const cache = getImageCache();
  const cached = cache[venueName];

  if (!cached) return null;
  if (Date.now() - cached.timestamp >= CACHE_DURATION) return null;

  return cached.url;
}

async function fetchPlacesImage(venueName: string): Promise<string | null> {
  const q = (venueName || '').replace(/, London$/i, '').trim();
  if (!q) return null;

  try {
    const resp = await fetch(
      `/api/place-photo?q=${encodeURIComponent(q + ' London')}`
    );
    if (!resp.ok) return null;

    const data = await resp.json();
    if (data && typeof data.imageUrl === 'string' && data.imageUrl.length > 0) {
      setImageCache(venueName, data.imageUrl, 'places');
      return data.imageUrl;
    }
    return null;
  } catch {
    return null;
  }
}

function getPlaceholderImage(venueName: string, types: VenueType[]): string {
  const colors: Partial<Record<VenueType, string>> = {
    museums: '#8B5CF6',
    galleries: '#EC4899',
    dining: '#F59E0B',
    theatre: '#EF4444',
    cinema: '#3B82F6',
    music: '#10B981',
    shopping: '#F97316',
    markets: '#84CC16',
    entertainment: '#6366F1',
    sports: '#14B8A6',
    wellness: '#A855F7',
    nightlife: '#F43F5E',
    libraries: '#06B6D4',
    gaming: '#8B5CF6',
    comedy: '#FBBF24',
    historic: '#D97706',
    workshops: '#059669',
    exhibitions: '#7C3AED',
    cafes: '#D97706',
    bowling: '#6366F1',
    spa: '#A855F7',
    food: '#F59E0B',
    bars: '#F43F5E',
    immersive: '#7C3AED',
    games: '#8B5CF6',
    escape: '#3B82F6',
    kids: '#10B981',
    family: '#10B981',
  };

  const color = (types[0] && colors[types[0]]) || '#6B7280';
  const initial = venueName.charAt(0).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${color}"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="120" fill="white" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
