import type { VenueType, AreaType, WetnessLevel } from './venue';

export interface FilterState {
  keywords: string;
  types: Set<VenueType>;
  areas: Set<AreaType>;
  wetness: WetnessLevel | null;
  maxWetnessScore: number;
  openNow: boolean;
  constraints: Set<string>;
}
