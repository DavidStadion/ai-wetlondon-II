/*
 * Resolve each venue to its Google place ID, once, and emit SQL to store it.
 *
 * Why this exists
 *
 * A place ID is the only part of a Places response Google lets you keep
 * indefinitely. Everything else is limited to roughly 30 days. So this is the
 * one field worth a one-off sweep, and having it turns every future photo
 * lookup into an ID-only field mask, which Google bills at nothing.
 *
 * The field mask below is deliberately `places.id` and nothing else. Add a
 * single further field and the whole sweep leaves the free ID-only tier and
 * starts costing money per venue. If you change it, price it first.
 *
 * Writes SQL rather than writing to the database, because RLS denies anonymous
 * writes and PostgREST answers `200 []` when it silently refuses, so a script
 * that thought it had written would have no way of knowing it had not.
 *
 * Usage
 *   node scripts/backfill-place-ids.mjs --limit 5      # dry sample, prove it works
 *   node scripts/backfill-place-ids.mjs --all          # the full sweep
 *
 * Needs GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY) in the environment, and
 * enough SearchTextRequest per day quota to cover --limit.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'place-id-backfill.sql');

/* Load .env without a dependency: only the names this script needs. */
if (existsSync(join(ROOT, '.env'))) {
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const args = process.argv.slice(2);
const all = args.includes('--all');
const limitArg = args.indexOf('--limit');
const limit = all ? Infinity : limitArg !== -1 ? Number(args[limitArg + 1]) : 5;

const API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_KEY;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!API_KEY) {
  console.error('[backfill] No Places key found.');
  console.error('[backfill] Add GOOGLE_PLACES_API_KEY=... to .env (it is gitignored) and retry.');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[backfill] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}

/** Place IDs are opaque but bounded. Anything else does not go near the SQL. */
const isPlaceId = (s) => typeof s === 'string' && /^[A-Za-z0-9_-]{10,255}$/.test(s);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchVenues() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/venues?select=id,name,place_id&order=id.asc`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error('Unexpected Supabase response');
  return rows;
}

/**
 * One Text Search per venue, ID only.
 *
 * The London location bias matters more than it looks: without it "Cutty Sark"
 * and "The Postal Museum" can resolve to somewhere else entirely, and a wrong
 * place ID is worse than none because nothing downstream would ever question it.
 */
async function resolvePlaceId(name) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id',
    },
    body: JSON.stringify({
      textQuery: `${name} London`,
      locationBias: {
        circle: { center: { latitude: 51.5074, longitude: -0.1278 }, radius: 50000 },
      },
      maxResultCount: 1,
    }),
  });

  if (res.status === 429) return { error: 'quota exhausted' };
  if (!res.ok) return { error: `${res.status} ${(await res.text()).slice(0, 120)}` };

  const data = await res.json();
  const id = data?.places?.[0]?.id;
  if (!id) return { error: 'no match' };
  if (!isPlaceId(id)) return { error: `implausible id: ${String(id).slice(0, 40)}` };
  return { id };
}

const venues = await fetchVenues();
const todo = venues.filter((v) => !v.place_id).slice(0, limit === Infinity ? undefined : limit);

console.log(`[backfill] ${venues.length} venues, ${venues.filter((v) => !v.place_id).length} without a place_id`);
console.log(`[backfill] resolving ${todo.length}${all ? ' (full sweep)' : ` (sample, use --all for everything)`}\n`);

const resolved = [];
const failed = [];
let quotaHit = false;

for (const [i, v] of todo.entries()) {
  const { id, error } = await resolvePlaceId(v.name);
  if (id) {
    resolved.push({ id: v.id, name: v.name, placeId: id });
    console.log(`  ok    ${String(i + 1).padStart(3)}  ${v.name}`);
  } else {
    failed.push({ name: v.name, error });
    console.log(`  FAIL  ${String(i + 1).padStart(3)}  ${v.name}  (${error})`);
    if (error === 'quota exhausted') { quotaHit = true; break; }
  }
  // Comfortably inside the 60-per-minute quota, and polite besides.
  if (i < todo.length - 1) await sleep(1100);
}

if (quotaHit) {
  console.log('\n[backfill] Stopped: the daily SearchTextRequest quota is exhausted.');
  console.log('[backfill] Raise it in the Cloud console and rerun. Everything resolved so far is below.');
}

if (resolved.length) {
  const values = resolved
    .map((r, i) => `    (${i === 0 ? `${r.id}::bigint` : r.id}, '${r.placeId}')`)
    .join(',\n');

  const sql =
    `-- Generated by scripts/backfill-place-ids.mjs\n` +
    `-- ${resolved.length} venues resolved. Paste into the Supabase SQL editor.\n` +
    `-- Check the ref is iguspxisuudvvlcbtaxk before running.\n\n` +
    `UPDATE public.venues AS v\n` +
    `SET place_id = d.place_id\n` +
    `FROM (VALUES\n${values}\n) AS d(id, place_id)\n` +
    `WHERE v.id = d.id;\n\n` +
    `-- Expect: UPDATE ${resolved.length}\n` +
    `SELECT count(*) AS venues, count(place_id) AS with_place_id FROM public.venues;\n`;

  writeFileSync(OUT, sql);
  console.log(`\n[backfill] wrote ${resolved.length} updates to docs/place-id-backfill.sql`);
}

if (failed.length) {
  console.log(`\n[backfill] ${failed.length} could not be resolved:`);
  for (const f of failed) console.log(`    ${f.name}  (${f.error})`);
  console.log('[backfill] These keep the existing search-per-image path, which still works.');
}

console.log(`\n[backfill] done: ${resolved.length} resolved, ${failed.length} failed`);
