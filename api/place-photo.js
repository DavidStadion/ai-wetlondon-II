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

  /*
   * Cache successful lookups at the CDN.
   *
   * This is the ?q= half of the endpoint: venue name in, Places searchText out.
   * It was sending no Cache-Control at all, so Vercel defaulted to
   * "max-age=0, must-revalidate" and every visitor's every card ran a fresh
   * Places search. One cold page view of /all-activities cost about 48 API
   * calls against a 2,000/day cap: roughly 41 visitors a day before images
   * started failing, which is a site that breaks on the day it succeeds.
   *
   * A venue's name does not change and neither does the place it resolves to,
   * so this is safe to cache hard. The CDN now answers for every visitor after
   * the first, rather than each browser caching separately in localStorage.
   * Errors are deliberately left uncached so a blip does not stick.
   */
  if (status === 200) {
    res.setHeader(
      'Cache-Control',
      'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800',
    );
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }

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


/*
 * Abuse guard.
 *
 * This endpoint was an open proxy: any query from anywhere reached Google Places
 * Text Search, and every call is billed. A request for "Eiffel Tower Paris"
 * returned a photo, which means a loop could have run up a large bill on the
 * project's card with nothing to show for it.
 *
 * The site only ever asks for venues it lists, so the fix is to accept only
 * those. The name list is read once per cold start from Supabase, where venues
 * are publicly readable anyway.
 */
let venueNames = null;
let venueNamesAt = 0;
const VENUE_TTL = 30 * 60 * 1000;

let venuePlaceIds = null;

async function knownVenueNames() {
  const now = Date.now();
  if (venueNames && now - venueNamesAt < VENUE_TTL) return venueNames;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;   // cannot verify, so do not block

  try {
    // place_id comes along for the ride: this request already happens, and the
    // alternative is a second round trip per image to fetch one short string.
    //
    // Retried without it if the column is not there yet. PostgREST answers 400
    // with code 42703 for an unknown column, and without this retry deploying
    // ahead of the migration would make the whole lookup fail, which makes
    // isKnownVenueQuery fail open and quietly switches off the allowlist that
    // stops arbitrary queries spending money. Now the order does not matter.
    const get = (select) =>
      fetch(`${url}/rest/v1/venues?select=${select}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });

    let r = await get('name,place_id');
    let hasPlaceId = r.ok;
    if (!r.ok) r = await get('name');

    if (!r.ok) return null;
    const rows = await r.json();
    venueNames = new Set(rows.map((v) => String(v.name).toLowerCase().trim()));
    venuePlaceIds = hasPlaceId
      ? new Map(
        rows
          .filter((v) => v.place_id)
          .map((v) => [String(v.name).toLowerCase().trim(), String(v.place_id)]),
      )
      : new Map();
    venueNamesAt = now;
    return venueNames;
  } catch {
    return null;
  }
}

/**
 * The stored place ID for a query, if we have swept this venue.
 *
 * Matches the same way isKnownVenueQuery does, because the client appends
 * " London" and sometimes an area, and a near miss here silently costs money:
 * it falls back to the paid Text Search rather than failing visibly.
 */
async function storedPlaceId(query) {
  await knownVenueNames();
  if (!venuePlaceIds || venuePlaceIds.size === 0) return null;

  const q = query.toLowerCase().trim().replace(/\s+london$/, '').trim();
  if (venuePlaceIds.has(q)) return venuePlaceIds.get(q);
  for (const [name, id] of venuePlaceIds) {
    if (q === name || q.startsWith(name + ' ') || q.startsWith(name + ',')) return id;
  }
  return null;
}

/**
 * Photo references for a known place ID.
 *
 * `photos` sits in Google's Essentials IDs Only tier, which is billed at
 * nothing, so this replaces a paid Text Search with a free lookup. That is the
 * entire point of storing the ID: of £41.31 spent on Places in the first half of
 * August, about £27 was these lookups.
 *
 * Do not add fields to this mask. One extra field moves the call out of the free
 * tier and reintroduces the cost this exists to remove.
 */
async function photosForPlaceId(apiKey, placeId) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const data = await fetchJson(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'photos',
    },
  });
  return data?.photos || [];
}

/** The client appends " London" to the venue name; tolerate that and a suffix. */
async function isKnownVenueQuery(query) {
  const names = await knownVenueNames();
  if (!names) return true;   // fail open rather than break the site on a blip

  const q = query.toLowerCase().trim().replace(/\s+london$/, '').trim();
  if (names.has(q)) return true;
  // Some callers pass "<name>, <area>" or a trailing qualifier.
  for (const n of names) {
    if (q === n || q.startsWith(n + ' ') || q.startsWith(n + ',')) return true;
  }
  return false;
}

/** Places photo names have a fixed shape; anything else is not ours to fetch. */
function isPlausiblePhotoName(name) {
  return /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_\-]+$/.test(String(name));
}

/* Light per-instance rate limit. Not a substitute for a quota cap on the Google
   project, but it turns a cheap loop into an expensive one. */
const hits = new Map();
function rateLimited(req, limit = 60, windowMs = 60_000) {
  const ip = (req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > windowMs) {
    hits.set(ip, { start: now, n: 1 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  rec.n += 1;
  return rec.n > limit;
}

export default async function handler(req, res) {
  try {
    if (rateLimited(req)) {
      res.setHeader('Retry-After', '60');
      return json(res, 429, { error: 'Too many requests' });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return json(res, 500, { error: 'Missing Places API key in env (GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY)' });
    }

    // Mode B: photo proxy
    const photoName = req.query?.photo;
    if (photoName) {
      if (!isPlausiblePhotoName(photoName)) {
        return json(res, 400, { error: 'Malformed photo reference' });
      }
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
    if (query.length > 120 || !(await isKnownVenueQuery(query))) {
      return json(res, 403, { error: 'Query not recognised' });
    }

    const wantGallery = req.query?.gallery === 'true';
    const cacheKey = wantGallery ? `gallery:${query.toLowerCase()}` : `q:${query.toLowerCase()}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return json(res, 200, cached);
    }

    /*
     * Two routes to the same photos.
     *
     * If the venue has been swept, we already know its place ID and can ask for
     * its photos directly on the free ID-only tier. If not, we fall back to the
     * paid Text Search that used to be the only path. The fallback is kept
     * deliberately: a venue the sweep could not match, or one added since, still
     * gets a picture rather than a placeholder.
     */
    let placeId = await storedPlaceId(query);
    let photos = [];

    if (placeId) {
      try {
        photos = await photosForPlaceId(apiKey, placeId);
      } catch {
        // fetchJson throws on any non-OK response, and a stored ID can go stale:
        // venues close, and Google retires and merges IDs. Swallowing it here
        // means a dead ID costs one wasted free call and then behaves exactly as
        // it did before the sweep, rather than turning into a 500.
        photos = [];
      }
      // A stored ID that returns no photos is not worth trusting either, so drop
      // through to the search rather than reporting the venue as pictureless.
      if (photos.length === 0) placeId = null;
    }

    if (!placeId) {
      const findUrl = 'https://places.googleapis.com/v1/places:searchText';
      const findData = await fetchJson(findUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          // Request multiple photos for gallery mode
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
      placeId = place?.id;
      photos = place?.photos || [];
    }

    const photoRef = photos[0]?.name;

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

    // For gallery mode, return multiple photo URLs (up to 10)
    if (wantGallery && photos.length > 0) {
      const galleryUrls = photos.slice(0, 10).map(p =>
        `/api/place-photo?photo=${encodeURIComponent(p.name)}&w=900&h=600`
      );
      const payload = { imageUrl, placeId, galleryUrls };
      cacheSet(cacheKey, payload);
      return json(res, 200, payload);
    }

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
