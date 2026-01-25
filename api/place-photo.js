/**
 * /api/place-photo
 *
 * Two modes:
 * 1) ?q=British%20Museum
 *    -> returns JSON: { imageUrl: "/api/place-photo?photo=<photoName>&w=900&h=600", placeId, photos: [...] }
 *
 * 2) ?photo=places/<placeId>/photos/<photoId>&w=900&h=600
 *    -> streams the image bytes (no API key exposed to the client)
 */

const DEFAULT_W = 900;
const DEFAULT_H = 600;

function getApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
}

function toInt(value, fallback) {
  const n = parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default async function handler(req, res) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      res.status(500).json({ error: "Missing GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY)" });
      return;
    }

    const { q, photo } = req.query || {};
    const w = toInt(req.query?.w, DEFAULT_W);
    const h = toInt(req.query?.h, DEFAULT_H);

    // Mode 2: stream image bytes
    if (photo) {
      const photoName = String(photo);

      // IMPORTANT: do not encode the path (it contains slashes). Only encode query params.
      const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${encodeURIComponent(
        String(w)
      )}&maxHeightPx=${encodeURIComponent(String(h))}&key=${encodeURIComponent(apiKey)}`;

      const upstream = await fetch(url, { redirect: "follow" });
      if (!upstream.ok) {
        const txt = await upstream.text().catch(() => "");
        res.status(502).json({ error: "Photo fetch failed", details: txt || upstream.statusText });
        return;
      }

      const contentType = upstream.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");

      const arrayBuffer = await upstream.arrayBuffer();
      res.status(200).send(Buffer.from(arrayBuffer));
      return;
    }

    // Mode 1: query -> pick photos
    if (!q) {
      res.status(400).json({ error: "Missing query param: q" });
      return;
    }

    const queryText = String(q);
    const searchUrl = "https://places.googleapis.com/v1/places:searchText";

    const body = {
      textQuery: queryText,
      languageCode: "en",
      regionCode: "GB",
      maxResultCount: 1,
    };

    const searchResp = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        // Keep this lean. We need id + up to 4 photo names.
        "X-Goog-FieldMask": "places.id,places.photos.name",
      },
      body: JSON.stringify(body),
    });

    if (!searchResp.ok) {
      const txt = await searchResp.text().catch(() => "");
      res.status(502).json({ error: "Places search failed", details: txt || searchResp.statusText });
      return;
    }

    const data = await searchResp.json();
    const place = data?.places?.[0];
    const placeId = place?.id || null;
    const photoNames = (place?.photos || [])
      .map((p) => p?.name)
      .filter(Boolean)
      .slice(0, 4);

    if (!photoNames.length) {
      res.status(200).json({ imageUrl: null, placeId, photos: [] });
      return;
    }

    const photos = photoNames.map((name) => `/api/place-photo?photo=${encodeURIComponent(name)}&w=${w}&h=${h}`);
    res.status(200).json({ imageUrl: photos[0], placeId, photos });
  } catch (err) {
    res.status(500).json({ error: "Unexpected error", details: String(err?.message || err) });
  }
}
