import { useState, useEffect } from 'preact/hooks';
import type { VenueType } from '../types';
import { toneFor } from '@/utils/venueTone';

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
/**
 * `placeholderLabel` exists because the thing a card shows a photo of is not
 * always the thing a card is called. Category and collection cards borrow a lead
 * venue's photograph, so the Gaming tile was falling back to a ghosted D for DNA
 * VR and Wellness to an E for ESPA: a letter belonging to a venue the card never
 * mentions. Pass whatever the card actually prints and the initial always
 * matches the words next to it.
 */
export function useImageLoader(
  venueName: string,
  venueTypes: VenueType[] = [],
  placeholderLabel?: string
): ImageLoaderState {
  const placeholder = getPlaceholderImage(placeholderLabel ?? venueName, venueTypes);
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

/*
 * The no-photo state.
 *
 * Two things were wrong with the old one, and the second was the serious one.
 *
 * It looked foreign. A flat rainbow rectangle with a 120px Arial initial, on a
 * site set in Newsreader on near-black and one blue. When it appeared, people
 * read it as a broken page rather than as a venue without a photo, which is a
 * problem worth solving properly: roughly two thirds of the catalogue is
 * commercial venues that Wikimedia has no picture of, and the Places API is
 * quota-capped, so this is the majority experience for a good part of the site.
 *
 * And every single one of its 28 colours failed contrast. ActivityCard lays
 * white text over this image, and amber gave that white 1.67:1 against a 4.5:1
 * requirement. That is why a card title could vanish into the placeholder
 * behind it. Every tone below clears 12:1, so the card's own text is safe
 * whatever category a venue is.
 *
 * Dark ink, a rain texture because that is what the site is about, and the
 * initial ghosted at 7% rather than shouting. Deliberately no venue name: the
 * card already prints it, and a placeholder that repeats it just competes.
 */

function getPlaceholderImage(venueName: string, types: VenueType[]): string {
  const tone = toneFor(types);
  const first = venueName.trim().charAt(0).toUpperCase();
  const initial = /[A-Z0-9]/.test(first) ? first : '';

  // Diagonal rain, every 34px, drawn past the edges so none of it ends mid-air.
  const rain = Array.from({ length: 16 }, (_, i) => {
    const x = i * 34 - 40;
    return `<line x1="${x}" y1="-20" x2="${x - 46}" y2="320"/>`;
  }).join('');

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">` +
    `<rect width="400" height="300" fill="${tone}"/>` +
    `<g stroke="#ffffff" stroke-opacity="0.11" stroke-width="1.6" stroke-linecap="round">${rain}</g>` +
    (initial
      ? `<text x="200" y="196" text-anchor="middle" font-family="Georgia,serif"` +
        ` font-size="180" fill="#ffffff" fill-opacity="0.07">${initial}</text>`
      : '') +
    `</svg>`;

  /*
   * The apostrophes matter. This string ends up inside an unquoted CSS url(),
   * and encodeURIComponent leaves ' ( ) alone, none of which are legal there.
   * A font stack written as Georgia,'Times New Roman',serif produced a
   * declaration the browser rejected outright, and because Preact assigns style
   * properties straight onto dom.style, a rejected value leaves no style
   * attribute at all: every image on the site silently disappeared rather than
   * looking wrong. Hence the plain font stack above and the belt-and-braces
   * escaping here.
   */
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');

  return `data:image/svg+xml,${encoded}`;
}
