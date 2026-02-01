export type PartnerType = 'workshops' | 'cooking' | 'pottery' | 'crafts' | 'art' | 'wellbeing' | 'other';
export type PartnerLocation = 'central' | 'north' | 'south' | 'east' | 'west';

export interface Partner {
  id: number;
  name: string;
  type: PartnerType;
  location: PartnerLocation;
  description: string;
  price: number;
  priceDisplay: string;
  websiteUrl: string | null;
  affiliateLink: string | null;
  imageFilename: string | null;
  featured: boolean;
  active: boolean;
}

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  workshops: 'Workshops',
  cooking: 'Cooking Classes',
  pottery: 'Pottery',
  crafts: 'Crafts',
  art: 'Art Classes',
  wellbeing: 'Wellbeing',
  other: 'Experience',
};

export const PARTNER_LOCATION_LABELS: Record<PartnerLocation, string> = {
  central: 'Central',
  north: 'North',
  south: 'South',
  east: 'East',
  west: 'West',
};
