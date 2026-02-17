export type EventCategory = 'exhibition' | 'theatre' | 'immersive' | 'music' | 'festival';

export interface Event {
  id: number;
  title: string;
  venue: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  price: number;
  priceDisplay: string;
  description: string;
  imageUrl: string | null;
  link: string;
}

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  exhibition: 'Exhibition',
  theatre: 'Theatre',
  immersive: 'Immersive Experience',
  music: 'Music & Concert',
  festival: 'Festival',
};
