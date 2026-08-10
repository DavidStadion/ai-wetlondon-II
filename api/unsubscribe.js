/*
 * One-click unsubscribe.
 *
 * Accepts GET as well as POST. GET is what a person clicking the link in an
 * email sends, and POST is what Gmail and Outlook send for their native
 * unsubscribe button (List-Unsubscribe-Post). Both must work, and both must
 * work without asking the person to log in or confirm anything: making
 * unsubscribing hard is how you end up marked as spam.
 */
import { db, hasStore, html, page } from './_lib/club.js';

export default async function handler(req, res) {
  if (!hasStore()) {
    html(res, 503, page({ title: 'Not available', body: '<h1>Not available</h1>' }));
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token') || '';

  if (!token) {
    html(res, 400, page({ title: 'Link incomplete', body: '<h1>That link is incomplete</h1><p>Reply to any of our emails and we will take you off by hand.</p>' }));
    return;
  }

  await db(`subscribers?token=eq.${encodeURIComponent(token)}&unsubscribed_at=is.null`, {
    method: 'PATCH',
    body: JSON.stringify({ unsubscribed_at: new Date().toISOString() }),
  });

  // Always report success. Whether the token matched is not the sender's
  // business to reveal, and a second click should not look like a failure.
  if (req.method === 'POST') {
    res.statusCode = 200;
    res.end();
    return;
  }

  html(res, 200, page({
    title: 'Unsubscribed',
    body: '<h1>Done, you are off the list</h1><p>No more rain alerts. The site is still there whenever it is chucking it down.</p>',
  }));
}
