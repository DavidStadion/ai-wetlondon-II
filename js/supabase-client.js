// Supabase Client Configuration for Wet London
// This connects your app to the Supabase database

const SUPABASE_URL = 'https://iguspxisuudvvlcbtaxk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndXNweGlzdXVkdnZsY2J0YXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTk1MjQsImV4cCI6MjA4NDIzNTUyNH0.hEE1PirNeuGnewi8qqbbCqYs9WuuY124vevo5fIpVr8'; // Paste your copied key here
// Initialize Supabase client (uses CDN-loaded library)
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        
        console.log('✅ Fetched', data.length, 'venues from database');
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
    return {
        name: dbVenue.name,
        type: dbVenue.type,
        location: dbVenue.location,
        wetness: dbVenue.wetness,
        wetnessScore: dbVenue.wetness_score,
        price: parseFloat(dbVenue.price) || 0,
        priceDisplay: dbVenue.price_display,
        description: dbVenue.description,
        rating: parseFloat(dbVenue.rating) || 4.5,
        sponsored: dbVenue.sponsored || false,
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
    
    try {
        const dbVenues = await fetchVenuesFromDB();
        
        // Convert to app format and store globally
        window.londonVenues = dbVenues.map(convertVenue);
        
        console.log('✅ Successfully loaded', window.londonVenues.length, 'venues');
        console.log('📊 Sponsored venues:', window.londonVenues.filter(v => v.sponsored).length);
        
        return true;
    } catch (error) {
        console.error('❌ Failed to load venues from Supabase:', error);
        console.log('⚠️ Falling back to local data.js if available');
        return false;
    }
}

// Expose functions globally for testing
window.loadVenuesFromSupabase = loadVenuesFromSupabase;
window.supabaseClient = supabaseClient;