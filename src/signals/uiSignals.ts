import { signal } from '@preact/signals';
import type { Venue } from '@/types';

// Modal states
export const isFilterModalOpen = signal<boolean>(false);
export const isActivityModalOpen = signal<boolean>(false);
export const isCustomizeModalOpen = signal<boolean>(false);
export const isShareModalOpen = signal<boolean>(false);
export const isBookingModalOpen = signal<boolean>(false);
export const isPrerequisitesModalOpen = signal<boolean>(false);

// Currently selected venue for detail view
/** Current route path. Layout sits outside <Router>, so it can't use useRouter. */
export const currentPath = signal<string>(
  typeof window !== 'undefined' ? window.location.pathname : '/',
);

export const selectedVenue = signal<Venue | null>(null);

/** A shuffled run of "feeling lucky" picks so the modal can cycle through them. */
export const luckyDeck = signal<Venue[]>([]);
export const luckyIndex = signal<number>(0);

export function stepLucky(delta: number): void {
  const deck = luckyDeck.value;
  if (deck.length === 0) return;
  const next = (luckyIndex.value + delta + deck.length) % deck.length;
  luckyIndex.value = next;
  selectedVenue.value = deck[next];
}

// Toast notifications
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
export const toasts = signal<Toast[]>([]);

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function showToast(message: string, type: Toast['type'] = 'info'): void {
  const id = generateId();
  toasts.value = [...toasts.value, { id, message, type }];
}

export function dismissToast(id: string): void {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

// Bookmarks
export const bookmarkedVenues = signal<Set<string>>(new Set());

export function toggleBookmark(venueName: string): void {
  const current = new Set(bookmarkedVenues.value);
  if (current.has(venueName)) {
    current.delete(venueName);
    showToast('Removed from bookmarks', 'info');
  } else {
    current.add(venueName);
    showToast('Added to bookmarks', 'success');
  }
  bookmarkedVenues.value = current;
  localStorage.setItem('bookmarks', JSON.stringify([...current]));
}

export function clearAllBookmarks(): void {
  bookmarkedVenues.value = new Set();
  localStorage.removeItem('bookmarks');
  showToast('All bookmarks cleared', 'info');
}

export function loadBookmarks(): void {
  try {
    const saved = localStorage.getItem('bookmarks');
    if (saved) {
      bookmarkedVenues.value = new Set(JSON.parse(saved));
    }
  } catch {
    // Ignore parse errors
  }
}

// Recently viewed
export const recentlyViewed = signal<string[]>([]);

export function addToRecentlyViewed(venueName: string): void {
  const current = recentlyViewed.value.filter((v) => v !== venueName);
  recentlyViewed.value = [venueName, ...current].slice(0, 10);
  localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed.value));
}

export function loadRecentlyViewed(): void {
  try {
    const saved = localStorage.getItem('recentlyViewed');
    if (saved) {
      recentlyViewed.value = JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
}
