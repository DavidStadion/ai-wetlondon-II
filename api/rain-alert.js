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

/**
 * Kept in step with slugify() in src/utils/slug.ts by hand. The API functions
 * are vanilla JS and are not compiled from the TypeScript sources, so they
 * cannot import it. If venue URLs ever 404 from an email, look here first.
 */
function slugify(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Three actual places, rather than two bare links.
 *
 * The old alert was a weather statistic and two category links, which is
 * structurally what a promotional blast looks like to a spam filter and is not
 * much of an email either. Naming real venues gives someone a reason to open
 * the next one, and engagement is the thing that actually moves inbox placement.
 *
 * Rotated on the date so a subscriber who gets a wet week does not receive the
 * same three museums five days running. Deterministic, so a retry inside the
 * same day cannot send a different list than the first attempt.
 */
async function pickVenues(today) {
  /*
   * Capped at £30. Somebody reading this at eight in the morning is deciding
   * what to do with today, and a £109 studio tour is not that decision. Rated
   * 4.5 and up, and 10% wet or drier, because the whole promise of the email is
   * that you will not get soaked getting there.
   */
  const res = await db(
    'venues?select=name,description,price,location,wetness_score,rating' +
      '&wetness_score=lte.10&rating=gte.4.5&price=lte.30&order=rating.desc&limit=80',
  );
  if (!res.ok) return [];
  const raw = await res.json().catch(() => []);
  if (!Array.isArray(raw) || raw.length === 0) return [];

  // The database still holds a handful of venues twice under slightly different
  // names, so dedupe on the slug or the same place can appear as two of three.
  const bySlug = new Map();
  for (const v of raw) if (!bySlug.has(slugify(v.name))) bySlug.set(slugify(v.name), v);
  const all = [...bySlug.values()];

  /*
   * Rotated with a stride rather than by one a day. Stepping one place along
   * gave near-identical picks on consecutive days: the Tottenham stadium tour
   * turned up three mornings running in testing, because the free-first pick and
   * the area spread both re-select from the same neighbours. Thirteen is coprime
   * with most list lengths, so the window genuinely moves.
   */
  const day = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86400000);
  const offset = (((day * 13) % all.length) + all.length) % all.length;
  const rotated = [...all.slice(offset), ...all.slice(0, offset)];

  const picked = [];
  const seenArea = new Set();

  // One free place first if there is one, because free is the easiest yes.
  const free = rotated.find((v) => Number(v.price) === 0);
  if (free) { picked.push(free); seenArea.add(free.location); }

  // Then spread across London rather than three things in Bloomsbury.
  for (const v of rotated) {
    if (picked.length >= 3) break;
    if (picked.includes(v) || seenArea.has(v.location)) continue;
    picked.push(v);
    seenArea.add(v.location);
  }

  // Backfill if the area spread ran out of candidates.
  for (const v of rotated) {
    if (picked.length >= 3) break;
    if (!picked.includes(v)) picked.push(v);
  }

  return picked.slice(0, 3);
}

const AREA_LABEL = {
  central: 'Central London', north: 'North London', south: 'South London',
  east: 'East London', west: 'West London',
};

/** "Free" or "£14", and the part of town. The two things that decide a yes. */
function venueLine(v) {
  const price = Number(v.price) === 0 ? 'Free' : `£${Math.round(Number(v.price))}`;
  const area = AREA_LABEL[v.location] ?? 'London';
  return `${price}, ${area}`;
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

  const picks = await pickVenues(today);

  const textPicks = picks
    .map((v) => `${v.name} (${venueLine(v)})\n${SITE}/venue/${slugify(v.name)}`)
    .join('\n\n');

  const htmlPicks = picks
    .map(
      (v) => `<p style="margin:0 0 16px">
        <a href="${SITE}/venue/${slugify(v.name)}" style="color:#1f43ff;font-weight:600;text-decoration:none">${v.name}</a><br>
        <span style="color:#6b6b70;font-size:14px">${venueLine(v)}</span><br>
        <span style="font-size:15px">${String(v.description || '').slice(0, 110)}</span>
      </p>`,
    )
    .join('');

  const opener = picks.length
    ? 'Three places that will not care:'
    : 'Somewhere dry instead:';

  let sent = 0;
  const failures = [];

  for (const person of list) {
    const unsubscribeUrl = `${SITE}/api/unsubscribe?token=${encodeURIComponent(person.token)}`;
    const result = await sendEmail({
      to: person.email,
      subject: `${chance}% chance of rain ${when}. Three places that will not care`,
      text:
        `${chance}% chance of rain ${when} in London.\n\n` +
        `${opener}\n\n${textPicks}\n\n` +
        `More of them: ${SITE}/collection/chucking-it-down\n` +
        `With kids: ${SITE}/kids\n\n` +
        `You asked for these. Unsubscribe: ${unsubscribeUrl}`,
      html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#0c0c0d;max-width:520px">
        <p style="font-size:22px;margin:0 0 6px"><strong>${chance}% chance of rain ${when}.</strong></p>
        <p style="margin:0 0 22px;color:#6b6b70">${opener}</p>
        ${htmlPicks}
        <p style="margin:22px 0 0;padding-top:16px;border-top:1px solid #e6e6e4;font-size:15px">
          <a href="${SITE}/collection/chucking-it-down" style="color:#1f43ff">More places that work on the worst days</a><br>
          <a href="${SITE}/kids" style="color:#1f43ff">Somewhere to take the kids</a>
        </p>
        <p style="font-size:12px;color:#6b6b70;margin:20px 0 0">
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
