/*
 * Build-time snapshot of Supabase tables → public/data/*.json
 *
 * Purpose: a last-known-good fallback so the site keeps working even if the
 * Supabase project is paused (free-tier auto-pause) or unreachable at runtime.
 * The client (src/utils/supabase.ts) serves these files when a live query fails.
 *
 * Runs automatically before `npm run build` (see package.json "prebuild").
 * No-ops gracefully when credentials are absent (e.g. local dev without .env),
 * so it never breaks a build.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'data');

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_ANON_KEY;

const TABLES = ['venues', 'events', 'small_mighty_partners'];

async function fetchTable(table) {
  const res = await fetch(`${URL}/rest/v1/${table}?select=*`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

if (!URL || !KEY) {
  console.warn('[snapshot] No Supabase credentials found — skipping snapshot (build continues).');
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });

for (const table of TABLES) {
  try {
    const rows = await fetchTable(table);
    writeFileSync(join(OUT_DIR, `${table}.json`), JSON.stringify(rows));
    console.log(`[snapshot] ${table}: ${rows.length} rows saved`);
  } catch (err) {
    // Keep any previously-generated snapshot rather than failing the build.
    console.warn(`[snapshot] ${table} failed (${err.message}) — keeping previous snapshot if present.`);
  }
}
