// api/place-photo.js
// Vercel Serverless Function (Node.js runtime)
// Returns a Google Places photo URL for a given text query, or null.

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h
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

function pickBestPhoto(photos) {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  // Prefer widest photo if dimensions exist; else first.
  const sorted = [...photos].sort((a, b) => (b.widthPx || 0) - (a.widthPx || 0));
  return sorted[0]?.name || null; // places/{placeId}/photos/{photoRef}
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Prefer a server-side Places key (no HTTP referrer restriction).
// Fallback to GOOGLE_MAPS_API_KEY for backwards compatibility.
const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Missing GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY fallback)" });
      return;
    }

    const q = (req.query.q || "").toString().trim();
    if (!q) {
      res.status(400).json({ error: "Missing query param: q" });
      return;
    }

    const maxHeightPx = Number(req.query.h || 600);
    const maxWidthPx = Number(req.query.w || 900);

    const cacheKey = `${q}__${maxWidthPx}x${maxHeightPx}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.status(200).json(cached);
      return;
    }

    // Places API (New): Text Search (POST)
    // Requires X-Goog-Api-Key + X-Goog-FieldMask. :contentReference[oaicite:3]{index=3}
    const searchResp = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.photos",
      },
      body: JSON.stringify({
        textQuery: q,
        languageCode: "en",
        // This is intentionally minimal for v0. We can add location bias later.
      }),
    });

    if (!searchResp.ok) {
      const txt = await searchResp.text();
      res.status(502).json({ error: "Places search failed", details: txt.slice(0, 600) });
      return;
    }

    const searchJson = await searchResp.json();
    const place = (searchJson.places && searchJson.places[0]) || null;

    if (!place || !place.photos || place.photos.length === 0) {
      const payload = { imageUrl: null, placeId: place?.id || null };
      cacheSet(cacheKey, payload);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.status(200).json(payload);
      return;
    }

    const photoName = pickBestPhoto(place.photos);
    if (!photoName) {
      const payload = { imageUrl: null, placeId: place?.id || null };
      cacheSet(cacheKey, payload);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.status(200).json(payload);
      return;
    }

    // Photo media endpoint uses: places/{placeId}/photos/{photoRef}/media :contentReference[oaicite:4]{index=4}
    // We do not fetch the bytes; we return a URL that will redirect to the actual image.
    const mediaUrl =
      `https://places.googleapis.com/v1/${encodeURIComponent(photoName)}/media` +
      `?maxWidthPx=${encodeURIComponent(maxWidthPx)}` +
      `&maxHeightPx=${encodeURIComponent(maxHeightPx)}` +
      `&key=${encodeURIComponent(apiKey)}`;

    const payload = { imageUrl: mediaUrl, placeId: place.id || null };

    cacheSet(cacheKey, payload);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ error: "Unexpected error", details: String(err?.message || err) });
  }
}
