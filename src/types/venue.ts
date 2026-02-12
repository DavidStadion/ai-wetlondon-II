export type VenueType =
  | 'museums' | 'galleries' | 'theatre' | 'dining'
  | 'entertainment' | 'shopping' | 'nightlife'
  | 'wellness' | 'cinema' | 'historic' | 'sports'
  | 'workshops' | 'gaming' | 'music' | 'comedy' | 'markets'
  | 'exhibitions' | 'libraries'
  // Extended types for situations filtering
  | 'cafes' | 'bowling' | 'club' | 'spa' | 'food' | 'bars'
  | 'views' | 'cocktails' | 'immersive' | 'kids' | 'games'
  | 'escape' | 'coworking' | 'family' | 'aquariums' | 'science'
  | 'karaoke';

export type AreaType = 'central' | 'west' | 'east' | 'north' | 'south';
export type WetnessLevel = 'dry' | 'slightly' | 'wet';
export type CardVariant = 'default' | 'featured' | 'sponsored' | 'partner' | 'lucky' | 'spotlight' | 'spotlightHero';

export interface Venue {
  id?: number;
  name: string;
  type: VenueType[];
  location: AreaType;
  wetness: WetnessLevel;
  wetnessScore: number;
  price: number;
  priceDisplay: string;
  description: string;
  rating: number;
  sponsored?: boolean;
  highlighted?: boolean;
  featured?: boolean;
  spotlight?: boolean;
  affiliateLink?: string | null;
  prerequisites?: string[];
  openingHours?: Record<string, string> | null;
}
