/*
 * Confirm a rain alert subscription (the double opt-in link).
 *
 * Returns a page rather than JSON, because a person clicks this from an email.
 */
import { db, hasStore, html, page } from './_lib/club.js';

export default async function handler(req, res) {
  if (!hasStore()) {
    html(res, 503, page({ title: 'Not available', body: '<h1>Not available yet</h1><p>Rain alerts are not switched on.</p>' }));
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token') || '';

  if (!token) {
    html(res, 400, page({ title: 'Link incomplete', body: '<h1>That link is incomplete</h1><p>Try the button in the email again.</p>' }));
    return;
  }

  // Only confirms rows that are still unconfirmed and not unsubscribed, so a
  // recycled or replayed link cannot quietly resurrect someone who left.
  const r = await db(
    `subscribers?token=eq.${encodeURIComponent(token)}&confirmed_at=is.null&unsubscribed_at=is.null`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ confirmed_at: new Date().toISOString() }),
    },
  );

  const rows = r.ok ? await r.json().catch(() => []) : [];

  if (!Array.isArray(rows) || rows.length === 0) {
    // Could be already confirmed, or a dead link. Do not say which: that would
    // let someone test whether an address is on the list.
    html(res, 200, page({
      title: 'Nothing to do',
      body: '<h1>Nothing to do here</h1><p>That link has either been used already or has expired. If you are not getting alerts, just sign up again.</p>',
    }));
    return;
  }

  html(res, 200, page({
    title: 'You are in',
    body: '<h1>You are in</h1><p>We will email you on the mornings rain is on the way, with somewhere indoors worth going. Every email has an unsubscribe link, no hard feelings.</p>',
  }));
}
