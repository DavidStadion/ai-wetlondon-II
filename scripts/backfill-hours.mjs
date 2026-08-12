/**
 * Fills in opening hours for venues that have none.
 *
 * 98 of 333 venues (29%) hold no hours at all, so they can never appear under
 * "Open now" and their page says "Hours not available". That is a third of the
 * catalogue quietly missing from a core feature.
 *
 * Reads hours from Google Places through the site's own /api/place-details
 * endpoint, so the API key stays on the server and never comes near this
 * script. Writes SQL rather than touching the database: RLS denies anonymous
 * writes, and PostgREST returns "200 []" when it silently refuses, which is
 * exactly the kind of success-shaped failure this project has been bitten by
 * before.
 *
 *   node scripts/backfill-hours.mjs             # against production
 *   node scripts/backfill-hours.mjs --limit 5   # a small dry run first
 *
 * Output: sql/backfill-opening-hours.sql, to paste into the Supabase SQL
 * editor. Check the ref in the URL is iguspxisuudvvlcbtaxk before running it.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = process.env.WL_API_BASE || 'https://wetlondon.co.uk';

// The published cap is 60 requests a minute. Stay comfortably under it.
const DELAY_MS = 1200;

const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(args[limitArg + 1]) : Infinity;

const DAYS = { monday: 'mon', tuesday: 'tue', wednesday: 'wed', thursday: 'thu', friday: 'fri', saturday: 'sat', sunday: 'sun' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** "6:00 PM" / "10 AM" / "12:00 AM" to "18:00" / "10:00" / "00:00". */
function to24h(raw, inheritedMeridiem) {
  const m = raw.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ?? '00';
  const mer = (m[3] || inheritedMeridiem || '').toLowerCase();
  if (mer === 'pm' && h !== 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  if (h > 23) return null;
  return `${String(h).padStart(2, '0')}:${min}`;
}

/**
 * One Google weekday line to this project's value format.
 * Returns { value, note } where note flags anything a human should look at.
 */
function parseDayLine(spec) {
  const s = spec.trim();
  if (/^closed$/i.test(s)) return { value: 'Closed' };
  if (/open 24 hours/i.test(s)) return { value: '24/7' };

  // Google separates with an en dash, and ranges with a comma.
  const ranges = s.split(',').map((r) => r.trim()).filter(Boolean);
  const first = ranges[0].replace(/–|—/g, '-');
  const parts = first.split('-').map((p) => p.trim());
  if (parts.length !== 2) return { value: null, note: `unparsed: ${s}` };

  // "12:00 – 3:00 PM": the opening time inherits the closing meridiem.
  const closeMer = (parts[1].match(/(am|pm)/i) || [])[1];
  const open = to24h(parts[0], closeMer);
  const close = to24h(parts[1]);
  if (!open || !close) return { value: null, note: `unparsed: ${s}` };

  return {
    value: `${open}-${close}`,
    note: ranges.length > 1 ? `multiple ranges, kept the first: ${s}` : undefined,
  };
}

function toHoursObject(weekdayDescriptions) {
  const hours = {};
  const notes = [];
  for (const line of weekdayDescriptions) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const day = DAYS[line.slice(0, idx).trim().toLowerCase()];
    if (!day) continue;
    const { value, note } = parseDayLine(line.slice(idx + 1));
    if (value) hours[day] = value;
    if (note) notes.push(`${day}: ${note}`);
  }
  return { hours, notes };
}

/** Loose comparison, to catch Places returning a different business entirely. */
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function namesAgree(venueName, googleName) {
  const a = norm(venueName), b = norm(googleName);
  if (!b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const aw = new Set(a.split(' ').filter((w) => w.length > 2));
  const bw = new Set(b.split(' ').filter((w) => w.length > 2));
  if (!aw.size) return false;
  const shared = [...aw].filter((w) => bw.has(w)).length;
  return shared / aw.size >= 0.6;
}

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

/* ---------- run ---------- */

const venues = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'venues.json'), 'utf8'));
const missing = venues.filter((v) => !v.opening_hours || Object.keys(v.opening_hours).length === 0);

console.log(`[hours] ${missing.length} of ${venues.length} venues have no opening hours`);
const targets = missing.slice(0, LIMIT);
if (targets.length < missing.length) console.log(`[hours] limited to ${targets.length} this run`);

const updates = [];
const review = [];
const failed = [];

for (const [i, v] of targets.entries()) {
  const label = `${i + 1}/${targets.length} ${v.name}`;
  try {
    const res = await fetch(`${API}/api/place-details?q=${encodeURIComponent(`${v.name} London`)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const lines = data.regularOpeningHours;
    if (!data.placeId) { failed.push({ name: v.name, why: 'no Places match' }); console.log(`  -  ${label}: no match`); }
    else if (!namesAgree(v.name, data.displayName)) {
      review.push({ name: v.name, why: `Places returned "${data.displayName}"` });
      console.log(`  ?  ${label}: name mismatch, got "${data.displayName}"`);
    } else if (!lines || !lines.length) {
      failed.push({ name: v.name, why: 'Places has no hours for it' });
      console.log(`  -  ${label}: no hours published`);
    } else {
      const { hours, notes } = toHoursObject(lines);
      if (!Object.keys(hours).length) {
        failed.push({ name: v.name, why: 'could not parse any day' });
        console.log(`  -  ${label}: unparsed`);
      } else {
        updates.push({ id: v.id, name: v.name, hours, notes });
        console.log(`  ok ${label}: ${Object.keys(hours).length} days${notes.length ? '  (' + notes.join('; ') + ')' : ''}`);
      }
    }
  } catch (e) {
    failed.push({ name: v.name, why: String(e.message || e) });
    console.log(`  !  ${label}: ${e.message || e}`);
  }
  if (i < targets.length - 1) await sleep(DELAY_MS);
}

const lines = [
  '-- Opening hours backfill, generated by scripts/backfill-hours.mjs',
  '-- Source: Google Places regularOpeningHours, via /api/place-details',
  `-- ${updates.length} venues. Check the project ref is iguspxisuudvvlcbtaxk before running.`,
  '--',
  '-- Only touches rows that still have no hours, so re-running is safe and it',
  '-- will never overwrite hours someone has corrected by hand.',
  '',
  'BEGIN;',
  '',
];

for (const u of updates) {
  if (u.notes.length) lines.push(`-- ${u.name}: ${u.notes.join('; ')}`);
  lines.push(
    `UPDATE public.venues SET opening_hours = ${sqlStr(JSON.stringify(u.hours))}::jsonb`,
    `  WHERE id = ${u.id} AND (opening_hours IS NULL OR opening_hours = '{}'::jsonb);  -- ${u.name.replace(/\n/g, ' ')}`,
    '',
  );
}

lines.push('COMMIT;', '');
if (review.length) {
  lines.push('-- Needs a human eye, Places returned a differently named place:');
  review.forEach((r) => lines.push(`--   ${r.name}  ->  ${r.why}`));
  lines.push('');
}
if (failed.length) {
  lines.push('-- No hours available:');
  failed.forEach((f) => lines.push(`--   ${f.name}  (${f.why})`));
}

mkdirSync(join(ROOT, 'sql'), { recursive: true });
const out = join(ROOT, 'sql', 'backfill-opening-hours.sql');
writeFileSync(out, lines.join('\n'));

console.log('');
console.log(`[hours] ${updates.length} ready to write, ${review.length} need checking, ${failed.length} unavailable`);
console.log(`[hours] wrote ${out}`);
