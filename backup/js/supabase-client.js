// Supabase Client Configuration for Wet London
// This connects your app to the Supabase database

const SUPABASE_URL = 'https://iguspxisuudvvlcbtaxk.supabase.co';
// Using the Publishable API Key you provided
const SUPABASE_ANON_KEY = 'sb_publishable_7NmZ0J9oVtEaU6xxOAn9NQ_U80zq9cV'; 

// Initialize Supabase client using the global 'supabase' object from the CDN
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch all venues from Supabase database
 */
async function fetchVenuesFromDB() {
    try {
        console.log('📡 Fetching venues from Supabase...');
        
        const { data, error } = await supabaseClient
            .from('venues')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }
        
        console.log('✅ Fetched ' + data.length + ' venues from database');
        return data;
    } catch (error) {
        console.error('❌ Error fetching venues:', error);
        return [];
    }
}

/**
 * Convert database format (snake_case) to app format (camelCase)
 * This ensures compatibility with existing app code
 */
function convertVenue(dbVenue) {
    function normaliseCategory(raw) {
        if (raw == null) return null;

        let s = String(raw).trim();

        // Strip any leading/trailing braces that can appear in Postgres array-style strings
        s = s.replace(/^[{]+/, '').replace(/[}]+$/, '');

        // Remove stray punctuation, collapse whitespace
        s = s.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();

        if (!s) return null;
        return s.toLowerCase();
    }

    function toTypeArray(dbType) {
        if (Array.isArray(dbType)) return dbType;
        if (typeof dbType === 'string') {
            // Handles values like "{museums, dining}" or "museums, dining"
            const trimmed = dbType.trim();
            const withoutOuterBraces = trimmed.replace(/^[{]+/, '').replace(/[}]+$/, '');
            return withoutOuterBraces.split(',').map(s => s.trim());
        }
        return [];
    }

    const rawTypes = toTypeArray(dbVenue.type);
    const cleanedTypes = rawTypes.map(normaliseCategory).filter(Boolean);
    const uniqueTypes = Array.from(new Set(cleanedTypes));

    return {
        name: dbVenue.name,
        type: uniqueTypes,
        location: dbVenue.location,
        wetness: dbVenue.wetness,
        wetnessScore: dbVenue.wetness_score,
        price: parseFloat(dbVenue.price) || 0,
        priceDisplay: dbVenue.price_display,
        description: dbVenue.description,
        rating: parseFloat(dbVenue.rating) || 4.5,
        sponsored: dbVenue.sponsored || false,
        highlighted: dbVenue.highlighted || false,
        featured: dbVenue.featured || false,
        spotlight: dbVenue.spotlight || false,
        affiliateLink: dbVenue.affiliate_link || null,
        prerequisites: dbVenue.prerequisites || [],
        openingHours: dbVenue.opening_hours || null
    };
}

/**
 * Load venues from database and make them available globally
 * This replaces the hardcoded londonVenues array from data.js
 */
async function loadVenuesFromSupabase() {
    console.log('🚀 Loading venues from Supabase...');

    // Global flags the rest of the app can rely on
    window.__venuesLoading = true;
    window.__venuesLoaded = false;
    window.__venuesSource = 'unknown';
    
    try {
        const dbVenues = await fetchVenuesFromDB();
        
        if (!dbVenues || dbVenues.length === 0) {
            throw new Error('No data returned from Supabase');
        }

        // Convert to app format and store globally
        window.londonVenues = dbVenues.map(convertVenue);
        
        console.log('✅ Successfully loaded ' + window.londonVenues.length + ' venues');

        window.__venuesLoading = false;
        window.__venuesLoaded = true;
        window.__venuesSource = 'supabase';

        // Let the app know data is ready
        window.dispatchEvent(new CustomEvent('venues:loaded', { detail: { success: true, source: 'supabase', count: window.londonVenues.length } }));

        // Re-initialize app components that depend on data
        if (typeof updateActivityStats === 'function') updateActivityStats();
        if (typeof updateCategoryCounts === 'function') updateCategoryCounts();

        return true;
    } catch (error) {
        console.error('❌ Failed to load venues from Supabase:', error);
        console.log('⚠️ Falling back to local data.js if available');

        window.__venuesLoading = false;
        window.__venuesLoaded = false;
        window.__venuesSource = 'fallback';
        window.dispatchEvent(new CustomEvent('venues:loaded', { detail: { success: false, source: 'fallback', count: (window.londonVenues || []).length } }));

        return false;
    }
}

// Expose functions and client globally
window.loadVenuesFromSupabase = loadVenuesFromSupabase;
window.supabase = supabaseClient;