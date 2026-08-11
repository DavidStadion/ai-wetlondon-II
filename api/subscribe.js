/*
 * Join the rain alert club.
 *
 * Double opt-in: the address is stored unconfirmed and only receives alerts
 * after the confirm link is clicked. UK GDPR wants demonstrable consent, and it
 * also stops someone signing up an address that is not theirs.
 *
 * If no mailer is configured yet the signup is still stored and the response
 * says so honestly, so the list can grow before sending goes live.
 */
import { json, db, hasStore, newToken, isValidEmail, sendEmail, SITE } from './_lib/club.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: 'Use POST' });
    return;
  }
  if (!hasStore()) {
    json(res, 503, { ok: false, error: 'Signups are not configured yet' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Bots fill every field they find; a real person leaves this one empty.
  if (body.company) {
    json(res, 200, { ok: true, status: 'pending' });
    return;
  }

  const raw = String(body.email || '').trim();
  if (!isValidEmail(raw)) {
    json(res, 400, { ok: false, error: 'That does not look like an email address' });
    return;
  }

  /*
   * Stored lowercase. Uniqueness is enforced by a unique index on lower(email),
   * so normalising here keeps the stored value and the index in agreement and
   * lets a plain email=eq.<value> lookup find the row.
   */
  const email = raw.toLowerCase();
  const token = newToken();
  const source = typeof body.source === 'string' ? body.source.slice(0, 80) : null;

  /*
   * Insert, and treat a unique violation as "already signed up" rather than an
   * error, reissuing the token so a second attempt doubles as "resend my
   * confirmation".
   *
   * This was originally a PostgREST upsert with on_conflict=email, which always
   * failed: ON CONFLICT (email) needs a unique constraint on that exact column,
   * and ours is a functional index on lower(email), which does not satisfy it.
   * PostgREST cannot express a functional index as an on_conflict target, so the
   * insert-then-handle-409 shape is the way round it.
   */
  let row = null;

  const insert = await db('subscribers', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([{ email, token, source }]),
  });

  if (insert.ok) {
    const rows = await insert.json().catch(() => []);
    row = Array.isArray(rows) ? rows[0] : null;
  } else if (insert.status === 409) {
    // Already on the list. Reissue the token so the confirm link works.
    const update = await db(`subscribers?email=eq.${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ token, unsubscribed_at: null }),
    });
    if (update.ok) {
      const rows = await update.json().catch(() => []);
      row = Array.isArray(rows) ? rows[0] : null;
    }
  }

  if (!row) {
    // Log enough to diagnose without putting database detail in the response.
    // Guarded: the body has already been consumed on the success path.
    const detail = insert.bodyUsed ? '' : await insert.text().catch(() => '');
    console.error('[subscribe] failed', insert.status, detail.slice(0, 300));
    json(res, 500, { ok: false, error: 'Could not save that, please try again' });
    return;
  }

  // Already confirmed: say so rather than sending another confirmation.
  if (row?.confirmed_at && !row?.unsubscribed_at) {
    json(res, 200, { ok: true, status: 'already' });
    return;
  }

  const confirmUrl = `${SITE}/api/confirm?token=${encodeURIComponent(row?.token || token)}`;
  const result = await sendEmail({
    to: email,
    subject: 'Confirm your Wet London rain alerts',
    text: `Tap to confirm your rain alerts: ${confirmUrl}\n\nIf you did not sign up, ignore this email and nothing happens.`,
    html: `<p style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5">
      One tap and you are in. We will email you on the mornings rain is coming, with somewhere indoors to go.</p>
      <p><a href="${confirmUrl}" style="display:inline-block;background:#0c0c0d;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-family:Helvetica,Arial,sans-serif;font-weight:700">Confirm my alerts</a></p>
      <p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#6b6b70">If you did not sign up, ignore this and nothing happens.</p>`,
  });

  // A failed send used to still report 'check-email', which sent people to an
  // inbox nothing was arriving in and left the reason nowhere. Log it, and only
  // promise an email when one actually went.
  if (!result.ok && !result.skipped) {
    console.error('[subscribe] confirmation email failed:', result.error);
  }

  json(res, 200, {
    ok: true,
    // 'stored' means we have the address but could not email. The UI must not
    // tell people to check an inbox in that case.
    status: result.ok ? 'check-email' : 'stored',
  });
}
