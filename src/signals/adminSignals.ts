import { signal } from '@preact/signals';
import type { Venue } from '@/types/venue';
import type { Partner } from '@/types/partner';

export const isAuthenticated = signal<boolean>(false);
export const adminVenues = signal<Venue[]>([]);
export const adminPartners = signal<Partner[]>([]);
export const adminTab = signal<'venues' | 'partners'>('venues');
export const adminMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);

export function showAdminMessage(text: string, type: 'success' | 'error') {
  adminMessage.value = { text, type };
  setTimeout(() => {
    adminMessage.value = null;
  }, 3000);
}
