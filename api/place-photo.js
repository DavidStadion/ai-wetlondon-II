// api/place-photo.js
// Vercel Serverless Function (Node.js runtime)
//
// Usage:
// 1) GET /api/place-photo?q=British%20Museum
//    -> returns JSON: { imageUrl: "/api/place-photo?photo=...", placeId }
//
// 2) GET /api/place-photo?photo=places/.../photos/...&w=900&h=600
//    -> streams the image bytes (API key stays server-side)

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
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
  res.end(JSON.stringify(payload));
}

function getApiKey() {
  // Prefer a dedicated Places key, but fall back to your existing env var name.
  return (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_KEY ||
    ''
  );
}

function safeInt(value, fallback) {
  const n = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
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

async function proxyPhoto(res, apiKey, photoName, maxW, maxH) {
  // IMPORTANT: Do not encode slashes in photoName.
  const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxW}&maxHeightPx=${maxH}`;

  const upstream = await fetch(mediaUrl, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      // Ask for the binary image, not JSON
      'Accept': 'image/*'
    }
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return json(res, upstream.status, {
      error: 'Places photo failed',
      details: text
    });
  }

  // Pass through content-type, and cache at the edge
  const contentType = upstream.headers.get('content-type') || 'image/jpeg';
  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');

  const arrayBuffer = await upstream.arrayBuffer();
  res.end(Buffer.from(arrayBuffer));
}

export default async function handler(req, res) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return json(res, 500, { error: 'Missing Places API key in env (GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY)' });
    }

    // Mode B: photo proxy
    const photoName = req.query?.photo;
    if (photoName) {
      const maxW = safeInt(req.query?.w, 900);
      const maxH = safeInt(req.query?.h, 600);
      return await proxyPhoto(res, apiKey, String(photoName), maxW, maxH);
    }

    // Mode A: search by query (returns JSON with proxy URL)
    const q = req.query?.q;
    if (!q || String(q).trim().length === 0) {
      return json(res, 400, { error: 'Missing query param: q' });
    }

    const query = String(q).trim();
    const cacheKey = `q:${query.toLowerCase()}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return json(res, 200, cached);
    }

    // Find a place
    const findUrl = 'https://places.googleapis.com/v1/places:searchText';
    const findData = await fetchJson(findUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Keep this minimal. We just need place id + one photo reference.
        'X-Goog-FieldMask': 'places.id,places.photos'
      },
      body: JSON.stringify({
        textQuery: query,
        // Bias to London to keep results consistent for your use case
        locationBias: {
          circle: {
            center: { latitude: 51.5074, longitude: -0.1278 },
            radius: 50000
          }
        }
      })
    });

    const place = findData?.places?.[0];
    const placeId = place?.id;
    const photo = place?.photos?.[0];
    const photoRef = photo?.name;

    if (!placeId || !photoRef) {
      const payload = {
        imageUrl: null,
        placeId: placeId || null,
        note: 'No photo found for this query'
      };
      cacheSet(cacheKey, payload);
      return json(res, 200, payload);
    }

    // Return a proxy URL so the key never ends up in the browser
    const imageUrl = `/api/place-photo?photo=${encodeURIComponent(photoRef)}&w=900&h=600`;
    const payload = { imageUrl, placeId };

    cacheSet(cacheKey, payload);
    return json(res, 200, payload);
  } catch (e) {
    const status = e?.status || 500;
    return json(res, status, {
      error: 'Places request failed',
      details: typeof e?.details === 'object' ? e.details : String(e?.details || e?.message || e)
    });
  }
}
