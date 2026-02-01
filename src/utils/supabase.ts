import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Venue, VenueType, AreaType, WetnessLevel } from '../types';
import type { Event, EventCategory } from '../types/event';
import type { Partner, PartnerType, PartnerLocation } from '../types/partner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/** Database venue record (snake_case fields) */
export interface DbVenue {
  id?: number;
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
    id: dbVenue.id,
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

// ==========================================
// EVENTS
// ==========================================

export interface DbEvent {
  id: number;
  title: string;
  venue: string;
  category: string;
  start_date: string;
  end_date: string;
  price: number;
  price_display: string;
  description: string;
  image_url: string | null;
  link: string;
}

export function convertEvent(db: DbEvent): Event {
  return {
    id: db.id,
    title: db.title,
    venue: db.venue,
    category: db.category as EventCategory,
    startDate: db.start_date,
    endDate: db.end_date,
    price: db.price,
    priceDisplay: db.price_display,
    description: db.description,
    imageUrl: db.image_url,
    link: db.link,
  };
}

export async function fetchEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('end_date', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return data.map((row) => convertEvent(row as DbEvent));
}

// Sample events fallback
export const sampleEvents: Event[] = [
  {
    id: 1,
    title: "Van Gogh: Poets and Lovers",
    venue: "National Gallery",
    category: "exhibition",
    startDate: "2025-09-14",
    endDate: "2026-04-19",
    price: 24,
    priceDisplay: "From 24",
    description: "A major exhibition exploring Van Gogh's final years in the South of France.",
    imageUrl: null,
    link: "https://www.nationalgallery.org.uk"
  },
  {
    id: 2,
    title: "Hamilton",
    venue: "Victoria Palace Theatre",
    category: "theatre",
    startDate: "2017-12-21",
    endDate: "2026-12-31",
    price: 30,
    priceDisplay: "From 30",
    description: "The award-winning musical about Alexander Hamilton continues its run.",
    imageUrl: null,
    link: "https://hamiltonmusical.com/london"
  },
  {
    id: 3,
    title: "Secret Cinema: Back to the Future",
    venue: "Secret Location",
    category: "immersive",
    startDate: "2026-02-15",
    endDate: "2026-04-30",
    price: 75,
    priceDisplay: "From 75",
    description: "Step into Hill Valley with this fully immersive cinema experience.",
    imageUrl: null,
    link: "https://www.secretcinema.org"
  },
  {
    id: 4,
    title: "British Museum Late",
    venue: "British Museum",
    category: "exhibition",
    startDate: "2026-02-07",
    endDate: "2026-02-07",
    price: 0,
    priceDisplay: "FREE",
    description: "Special evening opening with talks, tours, and performances.",
    imageUrl: null,
    link: "https://www.britishmuseum.org"
  },
  {
    id: 5,
    title: "The Lion King",
    venue: "Lyceum Theatre",
    category: "theatre",
    startDate: "1999-10-19",
    endDate: "2026-12-31",
    price: 35,
    priceDisplay: "From 35",
    description: "Disney's award-winning musical spectacular continues to delight audiences.",
    imageUrl: null,
    link: "https://www.thelionking.co.uk"
  },
  {
    id: 6,
    title: "Frameless Immersive Art",
    venue: "Marble Arch",
    category: "immersive",
    startDate: "2022-10-07",
    endDate: "2026-12-31",
    price: 25,
    priceDisplay: "From 25",
    description: "London's largest immersive art experience featuring masterpieces from 4 galleries.",
    imageUrl: null,
    link: "https://frameless.com"
  }
];

// ==========================================
// PARTNERS
// ==========================================

export interface DbPartner {
  id: number;
  name: string;
  type: string;
  location: string;
  description: string | null;
  price: number;
  price_display: string | null;
  website_url: string | null;
  affiliate_link: string | null;
  image_filename: string | null;
  featured: boolean;
  active: boolean;
}

export function convertPartner(db: DbPartner): Partner {
  return {
    id: db.id,
    name: db.name,
    type: db.type as PartnerType,
    location: db.location as PartnerLocation,
    description: db.description || '',
    price: db.price,
    priceDisplay: db.price_display || (db.price === 0 ? 'FREE' : `From ${db.price}`),
    websiteUrl: db.website_url,
    affiliateLink: db.affiliate_link,
    imageFilename: db.image_filename,
    featured: db.featured,
    active: db.active,
  };
}

export async function fetchPartners(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from('small_mighty_partners')
    .select('*')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('name');

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return data.map((row) => convertPartner(row as DbPartner));
}

// ==========================================
// ADMIN CRUD
// ==========================================

export async function updateVenue(id: number, data: Partial<DbVenue>) {
  const { error } = await supabase
    .from('venues')
    .update(data)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteVenue(id: number) {
  const { error } = await supabase
    .from('venues')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createPartner(data: Partial<DbPartner>) {
  const { error } = await supabase
    .from('small_mighty_partners')
    .insert([data]);

  if (error) throw error;
}

export async function updatePartner(id: number, data: Partial<DbPartner>) {
  const { error } = await supabase
    .from('small_mighty_partners')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deletePartner(id: number) {
  const { error } = await supabase
    .from('small_mighty_partners')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchAllVenuesAdmin(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name');

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return data.map((row) => convertVenue(row as DbVenue));
}

export async function fetchAllPartnersAdmin(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from('small_mighty_partners')
    .select('*')
    .order('name');

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return data.map((row) => convertPartner(row as DbPartner));
}

export async function countFeaturedPartners(): Promise<number> {
  const { data } = await supabase
    .from('small_mighty_partners')
    .select('id')
    .eq('featured', true)
    .eq('active', true);

  return data?.length || 0;
}
