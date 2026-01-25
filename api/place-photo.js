// api/place-photo.js
// Vercel Serverless Function (Node.js runtime)
//
// Two modes:
// 1) /api/place-photo?q=British%20Museum&n=4&w=900&h=600
//    -> returns { imageUrl, images, placeId }
//       where imageUrl is the first image proxy URL and images is up to n proxy URLs
//
// 2) /api/place-photo?photo=places%2F...%2Fphotos%2F...&w=900&h=600
//    -> streams the actual image bytes (proxy) so your API key is never exposed to the browser.

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

function cacheSet(key, value, ttlMs = CACHE_TTL_MS) {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function clampInt(v, min, max, fallback) {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function takePhotoNames(photos, maxCount) {
  if (!Array.isArray(photos) || photos.length === 0) return [];

  // Prefer wider photos when width is available.
  const sorted = [...photos].sort((a, b) => (b.widthPx || 0) - (a.widthPx || 0));
  const names = [];

  for (const p of sorted) {
    if (p && typeof p.name === "string" && p.name.includes("/photos/")) {
      names.push(p.name);
      if (names.length >= maxCount) break;
    }
  }

  return names;
}

function buildProxyUrl(photoName, w, h) {
  return `/api/place-photo?photo=${encodeURIComponent(photoName)}&w=${encodeURIComponent(w)}&h=${encodeURIComponent(h)}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Missing GOOGLE_MAPS_API_KEY (or GOOGLE_PLACES_API_KEY)" });
      return;
    }

    const w = clampInt(req.query.w, 200, 2000, 900);
    const h = clampInt(req.query.h, 200, 2000, 600);

    // Mode 2: stream an image (proxy)
    const photo = (req.query.photo || "").toString().trim();
    if (photo) {
      const cacheKey = `photo__${photo}__${w}x${h}`;
      const cached = cacheGet(cacheKey);
      if (cached) {
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.setHeader("Content-Type", cached.contentType);
        res.status(200).send(cached.buffer);
        return;
      }

      const mediaUrl =
        `https://places.googleapis.com/v1/${encodeURIComponent(photo)}/media` +
        `?maxWidthPx=${encodeURIComponent(w)}` +
        `&maxHeightPx=${encodeURIComponent(h)}` +
        `&key=${encodeURIComponent(apiKey)}`;

      const mediaResp = await fetch(mediaUrl, { redirect: "follow" });
      if (!mediaResp.ok) {
        const txt = await mediaResp.text();
        res.status(502).json({ error: "Places photo fetch failed", details: txt.slice(0, 600) });
        return;
      }

      const arrayBuf = await mediaResp.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const contentType = mediaResp.headers.get("content-type") || "image/jpeg";

      // Cache the bytes in memory for a while.
      cacheSet(cacheKey, { buffer, contentType }, CACHE_TTL_MS);

      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Content-Type", contentType);
      res.status(200).send(buffer);
      return;
    }

    // Mode 1: search for a place and return up to n photo proxy URLs
    const q = (req.query.q || "").toString().trim();
    if (!q) {
      res.status(400).json({ error: "Missing query param: q" });
      return;
    }

    const n = clampInt(req.query.n, 1, 4, 1); // gallery wants max 4

    const cacheKey = `q__${q}__${n}__${w}x${h}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.status(200).json(cached);
      return;
    }

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
      }),
    });

    if (!searchResp.ok) {
      const txt = await searchResp.text();
      res.status(502).json({ error: "Places search failed", details: txt.slice(0, 600) });
      return;
    }

    const searchJson = await searchResp.json();
    const place = (searchJson.places && searchJson.places[0]) || null;

    const photoNames = takePhotoNames(place?.photos || [], n);
    const images = photoNames.map((name) => buildProxyUrl(name, w, h));

    const payload = {
      imageUrl: images[0] || null,
      images,
      placeId: place?.id || null,
    };

    cacheSet(cacheKey, payload, CACHE_TTL_MS);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ error: "Unexpected error", details: String(err?.message || err) });
  }
}
