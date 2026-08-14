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

// Keep in step with COLLECTIONS in src/utils/collections.ts and the copy map in
// scripts/prerender.mjs. Three lists, all hand-maintained: a collection missing
// from any one of them half-exists.
const COLLECTION_SLUGS = [
  'chucking-it-down', 'with-a-scoreboard', 'under-a-tenner', 'completely-free',
  'somewhere-weird', 'date-night', 'with-little-ones', 'quiet-please',
  'escape-the-heat',
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
  urls.push({ loc: `${SITE}${path}`, priority, freq, group: 'pages' });
}

for (const slug of COLLECTION_SLUGS) {
  urls.push({ loc: `${SITE}/collection/${slug}`, priority: '0.8', freq: 'weekly', group: 'collections' });
}

for (const slug of CATEGORY_SLUGS) {
  urls.push({ loc: `${SITE}/category/${slug}`, priority: '0.7', freq: 'weekly', group: 'categories' });
}

/*
 * The blog section gets its own child sitemap rather than joining 'pages'.
 * Articles are the answer to the thin-content problem, so whether they get
 * indexed is the one number worth being able to read on its own.
 */
const articlesFile = join(ROOT, 'public', 'data', 'articles.json');
if (existsSync(articlesFile)) {
  const articles = JSON.parse(readFileSync(articlesFile, 'utf8'));
  if (articles.length) {
    urls.push({ loc: `${SITE}/blog`, priority: '0.8', freq: 'weekly', group: 'blog' });
    for (const a of articles) {
      urls.push({ loc: `${SITE}/blog/${a.slug}`, priority: '0.7', freq: 'monthly', group: 'blog' });
    }
  }
  console.log(`[sitemap] ${articles.length} article URLs`);
} else {
  console.warn('[sitemap] no articles.json found — sitemap will omit the blog section');
}

const snapshot = join(ROOT, 'public', 'data', 'venues.json');
if (existsSync(snapshot)) {
  const venues = JSON.parse(readFileSync(snapshot, 'utf8'));
  const seen = new Set();
  for (const v of venues) {
    const slug = slugify(v.name || '');
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    urls.push({ loc: `${SITE}/venue/${slug}`, priority: '0.6', freq: 'weekly', group: 'venues' });
  }
  console.log(`[sitemap] ${seen.size} venue URLs`);
} else {
  console.warn('[sitemap] no venue snapshot found — sitemap will omit venue pages');
}

function urlsetXml(list) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${list
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
}

/*
 * One sitemap per section, behind an index.
 *
 * Two reasons. Search Console reports discovered and indexed counts per child
 * sitemap, so a section that is not getting indexed is visible instead of hidden
 * inside one total. And a sitemap at a new URL gets fetched promptly, where an
 * existing one Google has deprioritised can sit unread: this one went unread
 * from February to August while the site served every URL as a duplicate of the
 * homepage.
 */
const GROUPS = ['pages', 'blog', 'collections', 'categories', 'venues'];
const written = [];

for (const g of GROUPS) {
  const list = urls.filter((u) => u.group === g);
  if (!list.length) continue;
  const file = `sitemap-${g}.xml`;
  writeFileSync(join(ROOT, 'public', file), urlsetXml(list));
  written.push({ file, n: list.length });
}

// The single flat sitemap stays, so the URL already submitted keeps working.
writeFileSync(join(ROOT, 'public', 'sitemap.xml'), urlsetXml(urls));

const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${written
  .map((w) => `  <sitemap>
    <loc>${SITE}/${w.file}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`)
  .join('\n')}
</sitemapindex>
`;
writeFileSync(join(ROOT, 'public', 'sitemap-index.xml'), index);

for (const w of written) console.log(`[sitemap] ${w.file}: ${w.n} URLs`);
console.log(`[sitemap] sitemap.xml: ${urls.length} URLs (kept for the already-submitted URL)`);
console.log(`[sitemap] sitemap-index.xml references ${written.length} child sitemaps`);
