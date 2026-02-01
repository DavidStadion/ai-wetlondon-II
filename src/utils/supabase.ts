import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Venue, VenueType, AreaType, WetnessLevel } from '../types';

const SUPABASE_URL = 'https://iguspxisuudvvlcbtaxk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7NmZ0J9oVtEaU6xxOAn9NQ_U80zq9cV';

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/** Database venue record (snake_case fields) */
export interface DbVenue {
  name: string;
  type: string | string[];
  location: string;
  wetness: string;
  wetness_score: number;
  price: string | number;
  price_display: string;
  description: string;
  rating: string | number;
  sponsored?: boolean;
  highlighted?: boolean;
  featured?: boolean;
  spotlight?: boolean;
  affiliate_link?: string | null;
  prerequisites?: string[];
  opening_hours?: Record<string, string> | null;
}

/**
 * Convert database format (snake_case) to app format (camelCase).
 */
export function convertVenue(dbVenue: DbVenue): Venue {
  const rawTypes = toTypeArray(dbVenue.type);
  const cleanedTypes = rawTypes
    .map(normaliseCategory)
    .filter((t): t is VenueType => t !== null);
  const uniqueTypes = [...new Set(cleanedTypes)];

  return {
    name: dbVenue.name,
    type: uniqueTypes,
    location: dbVenue.location as AreaType,
    wetness: dbVenue.wetness as WetnessLevel,
    wetnessScore: dbVenue.wetness_score,
    price: parseFloat(String(dbVenue.price)) || 0,
    priceDisplay: dbVenue.price_display,
    description: dbVenue.description,
    rating: parseFloat(String(dbVenue.rating)) || 4.5,
    sponsored: dbVenue.sponsored || false,
    highlighted: dbVenue.highlighted || false,
    featured: dbVenue.featured || false,
    affiliateLink: dbVenue.affiliate_link || null,
    prerequisites: dbVenue.prerequisites || [],
    openingHours: dbVenue.opening_hours || null,
  };
}

/**
 * Fetch all venues from Supabase database.
 */
export async function fetchVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((row) => convertVenue(row as DbVenue));
}

function normaliseCategory(raw: unknown): VenueType | null {
  if (raw == null) return null;

  let s = String(raw).trim();
  // Strip leading/trailing braces from Postgres array-style strings
  s = s.replace(/^[{]+/, '').replace(/[}]+$/, '');
  // Remove stray punctuation, collapse whitespace
  s = s.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();

  if (!s) return null;
  return s.toLowerCase() as VenueType;
}

function toTypeArray(dbType: string | string[]): string[] {
  if (Array.isArray(dbType)) return dbType;
  if (typeof dbType === 'string') {
    const trimmed = dbType.trim();
    const withoutBraces = trimmed.replace(/^[{]+/, '').replace(/[}]+$/, '');
    return withoutBraces.split(',').map((s) => s.trim());
  }
  return [];
}
