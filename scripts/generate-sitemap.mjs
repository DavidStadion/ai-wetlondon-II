/*
 * Build a sitemap covering every real URL, including the venue and category
 * pages. Runs after the Supabase snapshot so it can read the same data.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SITE = 'https://wetlondon.co.uk';

const STATIC_PATHS = [
  ['/kids', '0.9', 'weekly'],
  ['/', '1.0', 'daily'],
  ['/all-activities', '0.9', 'daily'],
  ['/collections', '0.8', 'weekly'],
  ['/events', '0.8', 'daily'],
  ['/popups', '0.7', 'weekly'],
  ['/situations', '0.7', 'weekly'],
  // /saved is per-visitor localStorage content, so it is an empty page to a
  // crawler. Excluded here and disallowed in robots.txt.
  ['/about', '0.5', 'monthly'],
  ['/contact', '0.4', 'monthly'],
  ['/privacy', '0.2', 'yearly'],
  ['/terms', '0.2', 'yearly'],
  ['/cookies', '0.2', 'yearly'],
  ['/affiliate', '0.2', 'yearly'],
];

const COLLECTION_SLUGS = [
  'chucking-it-down', 'under-a-tenner', 'completely-free', 'somewhere-weird',
  'date-night', 'with-little-ones', 'quiet-please', 'escape-the-heat',
];

const CATEGORY_SLUGS = [
  'museums', 'galleries', 'theatre', 'dining', 'entertainment', 'shopping',
  'wellness', 'nightlife', 'music', 'comedy', 'cinema', 'gaming',
  'workshops', 'historic', 'markets', 'sports', 'exhibitions', 'libraries',
];

// Keep in step with src/utils/slug.ts
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const today = new Date().toISOString().slice(0, 10);
const urls = [];

for (const [path, priority, freq] of STATIC_PATHS) {
  urls.push({ loc: `${SITE}${path}`, priority, freq });
}

for (const slug of COLLECTION_SLUGS) {
  urls.push({ loc: `${SITE}/collection/${slug}`, priority: '0.8', freq: 'weekly' });
}

for (const slug of CATEGORY_SLUGS) {
  urls.push({ loc: `${SITE}/category/${slug}`, priority: '0.7', freq: 'weekly' });
}

const snapshot = join(ROOT, 'public', 'data', 'venues.json');
if (existsSync(snapshot)) {
  const venues = JSON.parse(readFileSync(snapshot, 'utf8'));
  const seen = new Set();
  for (const v of venues) {
    const slug = slugify(v.name || '');
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    urls.push({ loc: `${SITE}/venue/${slug}`, priority: '0.6', freq: 'weekly' });
  }
  console.log(`[sitemap] ${seen.size} venue URLs`);
} else {
  console.warn('[sitemap] no venue snapshot found — sitemap will omit venue pages');
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

writeFileSync(join(ROOT, 'public', 'sitemap.xml'), xml);
console.log(`[sitemap] wrote ${urls.length} URLs to public/sitemap.xml`);
