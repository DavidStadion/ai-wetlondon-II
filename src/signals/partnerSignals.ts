import { signal, computed } from '@preact/signals';
import type { Partner, PartnerType, PartnerLocation } from '@/types/partner';

export const partners = signal<Partner[]>([]);
export const locationFilter = signal<PartnerLocation | 'all'>('all');
export const typeFilter = signal<PartnerType | 'all'>('all');
export const isPartnersLoading = signal<boolean>(true);
export const partnersError = signal<string | null>(null);

export const filteredPartners = computed(() => {
  let result = partners.value;

  if (locationFilter.value !== 'all') {
    result = result.filter((p) => p.location === locationFilter.value);
  }

  if (typeFilter.value !== 'all') {
    result = result.filter((p) => p.type === typeFilter.value);
  }

  return result;
});

export function resetPartnerFilters() {
  locationFilter.value = 'all';
  typeFilter.value = 'all';
}
