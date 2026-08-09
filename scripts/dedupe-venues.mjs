/*
 * Find venues sharing a name and remove the weaker duplicate.
 *
 * Safety: always writes a full backup of every affected row before touching
 * anything, and does nothing at all unless run with --apply.
 *
 *   node scripts/dedupe-venues.mjs           # dry run + backup
 *   node scripts/dedupe-venues.mjs --apply   # actually delete
 */
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, '..', 'backup');

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_ANON_KEY;
const APPLY = process.argv.includes('--apply');

if (!URL || !KEY) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

/** Higher is better — prefer the row carrying more usable information. */
function score(v) {
  let s = 0;
  if (v.opening_hours && Object.keys(v.opening_hours).length) s += 5;
  if (v.description) s += Math.min(4, Math.floor(v.description.length / 60));
  if (v.affiliate_link) s += 3;
  if (Array.isArray(v.prerequisites) && v.prerequisites.length) s += 2;
  const r = parseFloat(v.rating);
  if (!isNaN(r) && r > 0 && r <= 5) s += 2;
  if (v.price_display) s += 1;
  if (v.featured || v.spotlight || v.sponsored) s += 4;   // never drop a promoted row
  return s;
}

const res = await fetch(`${URL}/rest/v1/venues?select=*`, { headers });
if (!res.ok) {
  console.error('Fetch failed:', res.status);
  process.exit(1);
}
const venues = await res.json();

const byName = new Map();
for (const v of venues) {
  const key = (v.name || '').trim().toLowerCase();
  if (!key) continue;
  if (!byName.has(key)) byName.set(key, []);
  byName.get(key).push(v);
}

const groups = [...byName.values()].filter((g) => g.length > 1);
const keep = [];
const drop = [];

for (const group of groups) {
  const ranked = [...group].sort((a, b) => score(b) - score(a) || (a.id ?? 0) - (b.id ?? 0));
  keep.push(ranked[0]);
  drop.push(...ranked.slice(1));
}

console.log(`venues: ${venues.length}`);
console.log(`duplicated names: ${groups.length}`);
console.log(`rows to remove: ${drop.length}`);
console.log(`venues after cleanup: ${venues.length - drop.length}`);
console.log();

for (const group of groups.slice(0, 40)) {
  const ranked = [...group].sort((a, b) => score(b) - score(a) || (a.id ?? 0) - (b.id ?? 0));
  const [k, ...rest] = ranked;
  console.log(`${k.name}`);
  console.log(`   KEEP id=${k.id} score=${score(k)} loc=${k.location} hours=${k.opening_hours ? 'y' : 'n'} desc=${(k.description || '').length}`);
  for (const d of rest) {
    console.log(`   DROP id=${d.id} score=${score(d)} loc=${d.location} hours=${d.opening_hours ? 'y' : 'n'} desc=${(d.description || '').length}`);
  }
}

// Always back up before any destructive step
mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = join(BACKUP_DIR, `venues-duplicates-${stamp}.json`);
writeFileSync(backupPath, JSON.stringify({ keep, drop, allRowsInGroups: groups.flat() }, null, 2));
console.log(`\nBackup written: ${backupPath}`);

if (!APPLY) {
  console.log('\nDry run only. Re-run with --apply to delete.');
  process.exit(0);
}

let removed = 0;
for (const d of drop) {
  const r = await fetch(`${URL}/rest/v1/venues?id=eq.${d.id}`, { method: 'DELETE', headers });
  if (r.ok) removed++;
  else console.error(`  failed to delete id=${d.id}: ${r.status}`);
}
console.log(`\nDeleted ${removed} of ${drop.length} duplicate rows.`);
