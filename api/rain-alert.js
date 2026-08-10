/*
 * The daily rain alert.
 *
 * Runs from Vercel Cron each morning, checks the London forecast, and only
 * emails when rain is actually likely. An alert that fires on a dry day is
 * worse than no alert at all.
 *
 * Three guards, because this endpoint can mail every subscriber:
 *   1. CRON_SECRET must match, so nobody else can trigger a send.
 *   2. A row is inserted into rain_alerts keyed on today's date before any
 *      email goes out. A unique violation means today is done, so a retried or
 *      double-fired cron cannot mail the list twice.
 *   3. ?dry=1 reports what it would do and sends nothing.
 */
import { db, hasStore, hasMailer, json, sendEmail, SITE } from './_lib/club.js';

// Same fixed London coordinates the site uses. No geolocation anywhere.
const LAT = 51.5074;
const LON = -0.1278;

/** Rain worth telling someone about, rather than a passing shower. */
const PROBABILITY_THRESHOLD = 55;
const MM_THRESHOLD = 0.5;

async function londonForecast() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    '&hourly=precipitation_probability,precipitation' +
    '&forecast_days=1&timezone=Europe%2FLondon';

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = await res.json();

  const times = data?.hourly?.time ?? [];
  const probs = data?.hourly?.precipitation_probability ?? [];
  const mm = data?.hourly?.precipitation ?? [];

  // Only the part of the day people still have plans for: 08:00 to 20:00.
  let peakProb = 0;
  let totalMm = 0;
  let peakHour = null;

  times.forEach((t, i) => {
    const hour = Number(String(t).slice(11, 13));
    if (hour < 8 || hour > 20) return;
    const p = Number(probs[i] ?? 0);
    totalMm += Number(mm[i] ?? 0);
    if (p > peakProb) { peakProb = p; peakHour = hour; }
  });

  return { peakProb, totalMm, peakHour };
}

function describe({ peakProb, peakHour }) {
  const when =
    peakHour == null ? 'today'
      : peakHour < 12 ? 'this morning'
        : peakHour < 17 ? 'this afternoon'
          : 'this evening';
  return { when, chance: Math.round(peakProb) };
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const dryRun = url.searchParams.get('dry') === '1';

  const secret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    json(res, 401, { ok: false, error: 'Unauthorised' });
    return;
  }

  if (!hasStore()) {
    json(res, 503, { ok: false, error: 'Store not configured' });
    return;
  }

  let forecast;
  try {
    forecast = await londonForecast();
  } catch (err) {
    json(res, 502, { ok: false, error: String(err) });
    return;
  }

  const wetEnough =
    forecast.peakProb >= PROBABILITY_THRESHOLD || forecast.totalMm >= MM_THRESHOLD;

  if (!wetEnough) {
    json(res, 200, { ok: true, sent: 0, reason: 'dry day', forecast });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const { when, chance } = describe(forecast);
  const summary = `${chance}% chance ${when}`;

  if (dryRun) {
    json(res, 200, { ok: true, dryRun: true, would: summary, forecast });
    return;
  }

  // Claim today before sending anything. A 409 means it is already claimed.
  const claim = await db('rain_alerts', {
    method: 'POST',
    body: JSON.stringify([{ sent_on: today, summary }]),
  });
  if (claim.status === 409) {
    json(res, 200, { ok: true, sent: 0, reason: 'already sent today' });
    return;
  }
  if (!claim.ok) {
    json(res, 500, { ok: false, error: `Could not claim today: ${claim.status}` });
    return;
  }

  if (!hasMailer()) {
    json(res, 200, { ok: true, sent: 0, reason: 'no mailer configured', would: summary });
    return;
  }

  const listRes = await db(
    'subscribers?select=email,token&confirmed_at=not.is.null&unsubscribed_at=is.null',
  );
  const list = listRes.ok ? await listRes.json().catch(() => []) : [];

  let sent = 0;
  const failures = [];

  for (const person of list) {
    const unsubscribeUrl = `${SITE}/api/unsubscribe?token=${encodeURIComponent(person.token)}`;
    const result = await sendEmail({
      to: person.email,
      subject: `Rain ${when}: ${chance}% chance. Here is somewhere dry`,
      text:
        `${chance}% chance of rain ${when} in London.\n\n` +
        `Somewhere indoors instead: ${SITE}/collection/chucking-it-down\n` +
        `With kids: ${SITE}/kids\n\n` +
        `Unsubscribe: ${unsubscribeUrl}`,
      html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#0c0c0d">
        <p style="font-size:22px;margin:0 0 12px"><strong>${chance}% chance of rain ${when}.</strong></p>
        <p style="margin:0 0 20px">Have a dry one instead.</p>
        <p style="margin:0 0 10px"><a href="${SITE}/collection/chucking-it-down" style="color:#1f43ff">Places that work on the worst days</a></p>
        <p style="margin:0 0 24px"><a href="${SITE}/kids" style="color:#1f43ff">Somewhere to take the kids</a></p>
        <p style="font-size:12px;color:#6b6b70;margin:0">
          You asked for these. <a href="${unsubscribeUrl}" style="color:#6b6b70">Unsubscribe</a>.
        </p>
      </div>`,
      unsubscribeUrl,
    });
    if (result.ok) sent += 1;
    else failures.push(person.email);
  }

  await db(`rain_alerts?sent_on=eq.${today}`, {
    method: 'PATCH',
    body: JSON.stringify({ recipients: sent }),
  });

  json(res, 200, { ok: true, sent, failed: failures.length, summary });
}
