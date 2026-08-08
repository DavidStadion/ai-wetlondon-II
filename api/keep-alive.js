/*
 * Keep-alive cron endpoint.
 *
 * Supabase free-tier projects auto-pause after ~7 days of inactivity, which
 * would take the site's data offline. A daily Vercel Cron (see vercel.json)
 * hits this endpoint to run a trivial query and keep the project active.
 */
function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default async function handler(_req, res) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    send(res, 500, { ok: false, error: 'Missing Supabase environment variables' });
    return;
  }

  try {
    const r = await fetch(`${url}/rest/v1/venues?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    send(res, 200, { ok: r.ok, status: r.status, pingedAt: new Date().toISOString() });
  } catch (err) {
    send(res, 500, { ok: false, error: String(err) });
  }
}
