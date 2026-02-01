import { signal, computed } from '@preact/signals';
import type { Event, EventCategory } from '@/types/event';

export const events = signal<Event[]>([]);
export const eventFilter = signal<EventCategory | 'all'>('all');
export const isEventsLoading = signal<boolean>(true);
export const eventsError = signal<string | null>(null);

export const filteredEvents = computed(() => {
  if (eventFilter.value === 'all') return events.value;
  return events.value.filter((e) => e.category === eventFilter.value);
});

export const endingSoonEvents = computed(() => {
  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  return filteredEvents.value.filter((e) => {
    const endDate = new Date(e.endDate);
    return endDate >= now && endDate <= twoWeeks;
  });
});

export const currentEvents = computed(() => {
  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  return filteredEvents.value.filter((e) => {
    const startDate = new Date(e.startDate);
    const endDate = new Date(e.endDate);
    return startDate <= now && endDate > twoWeeks;
  });
});

export const comingSoonEvents = computed(() => {
  const now = new Date();

  return filteredEvents.value.filter((e) => {
    const startDate = new Date(e.startDate);
    return startDate > now;
  });
});
