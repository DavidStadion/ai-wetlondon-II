// api/place-details.js
// Vercel Serverless Function - Fetches place details including reviews from Google Places API
//
// Usage:
// GET /api/place-details?q=British%20Museum%20London
// Returns: { placeId, rating, userRatingCount, reviews: [...], websiteUri, googleMapsUri }

const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours for reviews
const memoryCache = new Map();

function cacheGet(key) {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  memoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(payload));
}

function getApiKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_KEY ||
    ''
  );
}

async function fetchJson(url, options) {
  const resp = await fetch(url, options);
  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!resp.ok) {
    const err = new Error('HTTP_' + resp.status);
    err.status = resp.status;
    err.details = data;
    throw err;
  }
  return data;
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return json(res, 500, { error: 'Missing Places API key' });
    }

    const q = req.query?.q;
    if (!q || String(q).trim().length === 0) {
      return json(res, 400, { error: 'Missing query param: q' });
    }

    const query = String(q).trim();
    const cacheKey = `details:${query.toLowerCase()}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return json(res, 200, cached);
    }

    // Step 1: Search for the place to get place ID
    const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
    const searchData = await fetchJson(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName'
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: {
          circle: {
            center: { latitude: 51.5074, longitude: -0.1278 },
            radius: 50000
          }
        }
      })
    });

    const place = searchData?.places?.[0];
    if (!place?.id) {
      const payload = { placeId: null, reviews: [], note: 'Place not found' };
      cacheSet(cacheKey, payload);
      return json(res, 200, payload);
    }

    const placeId = place.id;

    // Step 2: Get place details including reviews
    const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}`;
    const detailsData = await fetchJson(detailsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews,websiteUri,googleMapsUri,formattedAddress,currentOpeningHours'
      }
    });

    // Format reviews for frontend
    const reviews = (detailsData.reviews || []).slice(0, 5).map(review => ({
      authorName: review.authorAttribution?.displayName || 'Anonymous',
      authorPhoto: review.authorAttribution?.photoUri || null,
      rating: review.rating || 5,
      text: review.text?.text || review.originalText?.text || '',
      relativeTime: review.relativePublishTimeDescription || '',
      publishTime: review.publishTime || null
    }));

    const payload = {
      placeId,
      displayName: detailsData.displayName?.text || query,
      rating: detailsData.rating || null,
      userRatingCount: detailsData.userRatingCount || 0,
      reviews,
      websiteUri: detailsData.websiteUri || null,
      googleMapsUri: detailsData.googleMapsUri || null,
      formattedAddress: detailsData.formattedAddress || null,
      openingHours: detailsData.currentOpeningHours?.weekdayDescriptions || null
    };

    cacheSet(cacheKey, payload);
    return json(res, 200, payload);

  } catch (e) {
    console.error('Place details error:', e);
    const status = e?.status || 500;
    return json(res, status, {
      error: 'Places request failed',
      details: typeof e?.details === 'object' ? e.details : String(e?.details || e?.message || e)
    });
  }
}
