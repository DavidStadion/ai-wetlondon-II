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
import { json, db, hasStore, hasMailer, newToken, isValidEmail, sendEmail, SITE } from './_lib/club.js';

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

  const email = String(body.email || '').trim();
  if (!isValidEmail(email)) {
    json(res, 400, { ok: false, error: 'That does not look like an email address' });
    return;
  }

  const token = newToken();
  const source = typeof body.source === 'string' ? body.source.slice(0, 80) : null;

  // on_conflict + merge-duplicates so a repeat signup is not an error. It also
  // reissues the token, which doubles as "resend me the confirmation".
  const insert = await db('subscribers?on_conflict=email', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([{ email, token, source }]),
  });

  if (!insert.ok) {
    json(res, 500, { ok: false, error: 'Could not save that, please try again' });
    return;
  }

  const rows = await insert.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;

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

  json(res, 200, {
    ok: true,
    // 'stored' means we have the address but cannot email yet. The UI must not
    // tell people to check an inbox in that case.
    status: result.skipped || !hasMailer() ? 'stored' : 'check-email',
  });
}
