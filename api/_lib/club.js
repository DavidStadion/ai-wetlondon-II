/*
 * Shared helpers for the rain alert club.
 *
 * Every subscriber read and write goes through here using the service role key.
 * That key bypasses RLS and must stay server-side: it is deliberately NOT
 * prefixed VITE_, because anything with that prefix is compiled into the
 * browser bundle and the mailing list would be public.
 */
import { randomBytes } from 'node:crypto';

export const SITE = 'https://wetlondon.co.uk';

export function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function html(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(body);
}

/*
 * api/reviews.js already reads SUPABASE_SERVICE_KEY and SUPABASE_URL, so both
 * spellings are accepted here. If those are already set in Vercel the club
 * needs no new Supabase variables at all.
 *
 * The anon key is deliberately not a fallback: it cannot read this table (RLS
 * denies it), so falling back would fail confusingly instead of loudly.
 */
export function serviceKey() {
  return process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function supabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
}

export function hasStore() {
  return Boolean(supabaseUrl() && serviceKey());
}

/** PostgREST call with the service role key. */
export async function db(path, init = {}) {
  const key = serviceKey();
  const res = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  return res;
}

export function newToken() {
  return randomBytes(24).toString('base64url');
}

/**
 * Deliberately conservative. Anything unusual is rejected rather than stored,
 * because a bad address costs sender reputation.
 */
export function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const email = value.trim();
  if (email.length < 5 || email.length > 254) return false;
  if (/\s/.test(email)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(email);
}

export function hasMailer() {
  return Boolean(process.env.RESEND_API_KEY && process.env.CLUB_FROM_ADDRESS);
}

/**
 * Send via Resend. Returns { ok, skipped, error }.
 *
 * `skipped` means no mailer is configured yet, which is not an error: signups
 * are still stored so the list can grow before sending goes live.
 */
export async function sendEmail({ to, subject, html: body, text, unsubscribeUrl }) {
  if (!hasMailer()) return { ok: false, skipped: true };

  const headers = {};
  if (unsubscribeUrl) {
    // Gmail and Outlook surface a native unsubscribe button from these, which
    // keeps people out of the spam button.
    headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.CLUB_FROM_ADDRESS,
        to: [to],
        subject,
        html: body,
        text,
        headers,
      }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/** Minimal branded page for the confirm and unsubscribe links. */
export function page({ title, body }) {
  return `<!doctype html>
<html lang="en-GB"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} | Wet London</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
         background:#fff; color:#0c0c0d; display:grid; place-items:center; min-height:100vh; padding:2rem; }
  main { max-width: 34rem; text-align:center; }
  h1 { font-family: Georgia, 'Times New Roman', serif; font-weight:400; font-size: clamp(2rem,6vw,3rem);
       line-height:1.05; letter-spacing:-0.02em; margin:0 0 1rem; }
  p { font-size:1.05rem; line-height:1.55; color:#3a3a40; margin:0 0 1.5rem; }
  a.btn { display:inline-block; background:#0c0c0d; color:#fff; text-decoration:none;
          padding:0.9rem 1.5rem; border-radius:10px; font-weight:700; }
</style>
</head><body><main>${body}<p><a class="btn" href="${SITE}">Back to Wet London</a></p></main></body></html>`;
}
