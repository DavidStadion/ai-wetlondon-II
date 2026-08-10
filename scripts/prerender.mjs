/**
 * Post-build prerenderer.
 *
 * The site is a client-rendered SPA, so every URL used to serve the same
 * index.html: the same <title>, the same description, and an empty body. That
 * is the single biggest thing holding back search, and social previews never
 * run JavaScript at all, so a shared link showed the homepage's text no matter
 * what page it pointed at.
 *
 * This writes a real HTML file per route, using the build snapshot as its data
 * source, with:
 *   - a unique title, description and canonical
 *   - Open Graph and Twitter tags that match the page
 *   - JSON-LD (breadcrumbs, plus a type appropriate to the page)
 *   - the page's actual copy in the body, so a crawler that does not execute
 *     JavaScript still sees content
 *
 * The app clears this markup before it renders, so it is never diffed against.
 *
 * Deliberately NOT emitted: aggregateRating. The ratings come from Google
 * Places and we hold no review count, and structured data that overstates a
 * rating is a penalty risk rather than a win.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://wetlondon.co.uk';

/* ---------- shared copy, kept in step with the app ---------- */

const CATEGORIES = {
  museums: ['Museums', 'Collections, curiosities and enough roof to see out any downpour.'],
  galleries: ['Galleries', 'Art worth standing still for, all of it comfortably indoors.'],
  theatre: ['Theatre', 'West End spectacle and tiny rooms above pubs. Both count.'],
  dining: ['Dining', 'Long lunches and somewhere warm to sit while it hammers down.'],
  entertainment: ['Entertainment', 'Immersive, interactive and reliably dry.'],
  shopping: ['Shopping', 'Department stores, arcades and markets with a roof.'],
  wellness: ['Wellness & Spa', 'Steam, sauna and doing very little on purpose.'],
  nightlife: ['Nightlife', 'Late ones that never need an umbrella.'],
  music: ['Music Venues', 'From jazz basements to arena-sized nights.'],
  comedy: ['Comedy Clubs', 'Cheap laughs and a low ceiling. Ideal.'],
  cinema: ['Cinemas', 'Two hours somewhere warm in a very big chair.'],
  gaming: ['Gaming', 'Arcades, VR, bowling and board games.'],
  workshops: ['Classes & Workshops', 'Make something with your hands while it pours outside.'],
  historic: ['Historic Sites', 'Centuries of London, mercifully under cover.'],
  markets: ['Markets', 'Covered markets. Browsing without the drenching.'],
  sports: ['Sports & Fitness', 'Climb, swim, skate and sweat indoors.'],
  exhibitions: ['Exhibitions', 'Shows worth catching before they close.'],
  libraries: ['Libraries', 'Quiet, free, and among the driest places in London.'],
};

const COLLECTIONS = {
  'chucking-it-down': ['Brilliant when it is chucking it down', 'The places that work hardest on the worst days. Straight off the tube, fully covered, and good enough to make you glad it rained.'],
  'under-a-tenner': ['Brilliant London for under a tenner', 'London gets an expensive reputation it only half deserves. Everything here costs a tenner or less, and plenty of it costs nothing at all.'],
  'completely-free': ['Costs absolutely nothing', 'World-class museums, strange little collections and some of the best buildings in the city. None of it will cost you a penny.'],
  'somewhere-weird': ['Somewhere genuinely weird', 'Neon warehouses, surgical theatres, houses frozen in another century. London is much stranger than it lets on.'],
  'date-night': ['Date night that is not just the pub', 'Low lighting, something to talk about, and a walk home that does not involve a downpour.'],
  'with-little-ones': ['Somewhere to take the kids', 'Places that can absorb a small person for a couple of hours without anyone melting down, including you.'],
  'quiet-please': ['Quiet, calm and nearly empty', 'Reading rooms, small collections and places most people walk past. Low noise, low crowds, no one hurrying you along.'],
  'escape-the-heat': ['Cool, dark and out of the sun', 'It is not always the rain. When the city hits thirty degrees these are the coolest rooms in London: shaded, indoors and usually air-conditioned.'],
};

const STATIC_PAGES = {
  '/all-activities': ['All indoor activities in London', 'Every indoor place we have found in London, rated by how dry you will stay. Filter by category, area, price and what is open right now.'],
  '/collections': ['Collections', 'Curated ways into London indoors: brilliant when it is chucking it down, under a tenner, somewhere genuinely weird, and more.'],
  '/about': ['About Wet London', 'Why we rate London by how wet you will get, how the wetness score works, and who is behind it.'],
  '/events': ['What is on in London right now', 'Exhibitions, shows and one-off nights worth catching, all of them indoors.'],
  '/popups': ['London pop-ups', 'Short-run pop-ups and residencies under a roof, before they disappear.'],
  '/contact': ['Contact Wet London', 'Suggest a place, report something out of date, or ask about being featured.'],
  '/privacy': ['Privacy Policy', 'What we collect, why, and how to get it removed.'],
  '/cookies': ['Cookie Policy', 'Which cookies we set, what they do, and how to change your mind.'],
  '/terms': ['Terms & Conditions', 'The terms that apply to using Wet London.'],
  '/affiliate': ['Affiliate Disclosure', 'When we earn a commission from a link, and what that does not change.'],
};

/* ---------- helpers ---------- */

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const slugify = (name) =>
  String(name).toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const AREA = { central: 'Central London', north: 'North London', south: 'South London', east: 'East London', west: 'West London' };

/**
 * The snapshot stores `type` exactly as Postgres returns it, which is a string
 * like "{museums,education}" rather than a JSON array. Mirrors toTypeArray()
 * in src/utils/supabase.ts.
 */
function typesOf(v) {
  const raw = v.type;
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim().toLowerCase());
  if (typeof raw !== 'string') return [];
  return raw
    .replace(/^[{]+/, '')
    .replace(/[}]+$/, '')
    .split(',')
    .map((s) => s.trim().replace(/^"|"$/g, '').toLowerCase())
    .filter(Boolean);
}

const label = (t) => (CATEGORIES[t] ? CATEGORIES[t][0] : t);

function dryness(score) {
  if (score <= 10) return 'you will stay bone dry';
  if (score <= 40) return 'you will stay mostly dry';
  return 'expect to get a bit wet getting there';
}

/** Swap a tag's attribute value in the template. */
function replaceTag(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

function buildHead(html, { title, description, path, jsonLd }) {
  const url = `${SITE}${path}`;
  let out = html;

  out = replaceTag(out, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  out = replaceTag(out, /(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`);
  out = replaceTag(out, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  out = replaceTag(out, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
  out = replaceTag(out, /(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
  out = replaceTag(out, /(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`);
  out = replaceTag(out, /(<meta name="twitter:url" content=")[^"]*(")/, `$1${url}$2`);
  out = replaceTag(out, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
  out = replaceTag(out, /(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(description)}$2`);

  if (jsonLd) {
    const block = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
    out = out.replace('</head>', `    ${block}\n  </head>`);
  }
  return out;
}

/** Static copy inside the app root. main.tsx clears it before rendering. */
function buildBody(html, inner) {
  return html.replace(
    /<div id="preact-root"><\/div>/,
    `<div id="preact-root"><div data-prerender="1" class="wl-prerender">${inner}</div></div>`,
  );
}

function breadcrumbs(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({
      '@type': 'ListItem', position: i + 1, name, item: `${SITE}${path}`,
    })),
  };
}

function write(path, html) {
  const dir = path === '/' ? DIST : join(DIST, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

/* ---------- page builders ---------- */

function venuePage(template, v) {
  const path = `/venue/${slugify(v.name)}`;
  const area = AREA[v.location] ?? 'London';
  const cats = typesOf(v).map(label).filter(Boolean);
  const price = Number(v.price) === 0 ? 'free to enter' : `from £${Math.round(Number(v.price))}`;
  const title = `${v.name} | ${area} indoor activity | Wet London`;
  const description = `${v.name} in ${area}: ${String(v.description || '').slice(0, 120)}`.trim().replace(/\s+/g, ' ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: v.name,
    description: v.description || undefined,
    url: `${SITE}${path}`,
    address: { '@type': 'PostalAddress', addressLocality: 'London', addressRegion: area, addressCountry: 'GB' },
    isAccessibleForFree: Number(v.price) === 0,
    publicAccess: true,
  };

  const inner = `
    <nav><a href="/">Wet London</a> / <a href="/all-activities">All activities</a></nav>
    <h1>${esc(v.name)}</h1>
    <p>${esc(v.description || '')}</p>
    <ul>
      <li>Area: ${esc(area)}</li>
      ${cats.length ? `<li>Category: ${esc(cats.join(', '))}</li>` : ''}
      <li>Price: ${esc(price)}</li>
      <li>Rain exposure: ${esc(dryness(Number(v.wetness_score) || 0))}</li>
    </ul>
    <p><a href="/all-activities">Browse every indoor activity in London</a></p>`;

  let html = buildHead(template, { title, description, path, jsonLd });
  html = html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(
    breadcrumbs([['Wet London', '/'], ['All activities', '/all-activities'], [v.name, path]]),
  )}</script>\n  </head>`);
  return { path, html: buildBody(html, inner) };
}

function listPage(template, { path, h1, blurb, title, description, items, type }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': type || 'CollectionPage',
    name: h1,
    description: blurb,
    url: `${SITE}${path}`,
    ...(items?.length
      ? {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: items.length,
            itemListElement: items.slice(0, 25).map((v, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: v.name,
              url: `${SITE}/venue/${slugify(v.name)}`,
            })),
          },
        }
      : {}),
  };

  const inner = `
    <nav><a href="/">Wet London</a></nav>
    <h1>${esc(h1)}</h1>
    <p>${esc(blurb)}</p>
    ${items?.length ? `<ul>${items.slice(0, 40).map((v) =>
      `<li><a href="/venue/${slugify(v.name)}">${esc(v.name)}</a>${v.description ? `: ${esc(String(v.description).slice(0, 100))}` : ''}</li>`).join('')}</ul>` : ''}`;

  let html = buildHead(template, { title, description, path, jsonLd });
  html = html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(
    breadcrumbs([['Wet London', '/'], [h1, path]]),
  )}</script>\n  </head>`);
  return { path, html: buildBody(html, inner) };
}

/**
 * The kids pillar page.
 *
 * The section copy below is the keyword-bearing part and is duplicated from
 * FAMILY_EDITS in src/utils/family.ts. Keep the two in step. The venue picking
 * is a deliberately coarse mirror of familyProfile(): it only decides which
 * links a crawler sees, and the app renders the real, fuller version a moment
 * later.
 */
const KIDS_EDITS = [
  ['Rainy day, kids climbing the walls', 'Fully indoors, straight off the tube, and enough going on to hold a small person for the afternoon.'],
  ['Brilliant with kids and completely free', 'A wet afternoon does not have to cost anything. All of these are free to walk into.'],
  ['Things they can actually touch', 'Buttons, levers, dressing up, building things. Places where "do not touch" is not the main rule.'],
  ['In and out in under two hours', 'For the days when that is all anyone has in them. Yours included.'],
  ['Step-free, lift access, buggy welcome', 'No stairs to wrestle, no cloakroom argument. Worth knowing before you set off.'],
  ['There is a loo and somewhere to eat', 'The two things that decide whether an outing survives to the end. Both on site.'],
];

function looksFamily(v) {
  const tags = (() => {
    const p = v.prerequisites;
    if (Array.isArray(p)) return p.map((x) => String(x).toLowerCase());
    if (typeof p === 'string') return p.replace(/^[{]+|[}]+$/g, '').split(',').map((s) => s.trim().toLowerCase());
    return [];
  })();
  const t = typesOf(v);
  const txt = `${v.name} ${v.description || ''}`.toLowerCase();
  const hit = (...n) => tags.some((tag) => n.some((x) => tag.includes(x)));

  const adults = t.some((x) => ['nightlife', 'club', 'bars', 'cocktails', 'karaoke', 'spa', 'wellness'].includes(x))
    || /\bbar\b|cocktail|nightclub|casino|adults only|18\+|wine tasting|gin tasting|brewery tour/.test(txt);
  if (adults) return 0;

  let s = 0;
  if (hit('family', 'child', 'kid') || t.includes('kids') || t.includes('family') || /children|kids|family|toddler/.test(txt)) s += 30;
  if (hit('interactive', 'educational', 'hands-on', 'workshop') || t.some((x) => ['science', 'gaming', 'games', 'workshops', 'immersive', 'aquariums'].includes(x))) s += 20;
  if (hit('step-free', 'lift access', 'pram', 'buggy', 'wheelchair accessible')) s += 15;
  if (hit('toilet', 'baby chang')) s += 10;
  if (hit('cafe', 'restaurant', 'food')) s += 10;
  if (Number(v.price) === 0) s += 8;
  if (hit('under 1 hour', 'under 2 hours')) s += 7;
  if (Number(v.wetness_score) <= 20) s += 5;
  return s;
}

function kidsPage(template, allVenues) {
  const path = '/kids';
  const title = 'Things to do with kids in London when it rains | Wet London';
  const picks = allVenues
    .map((v) => ({ v, s: looksFamily(v) }))
    .filter(({ s }) => s >= 30)
    .sort((a, b) => b.s - a.s)
    .map(({ v }) => v);

  const description = `Indoor London with children: free museums, hands-on places, step-free and buggy-friendly, and short visits for a bad day. ${picks.length} places, rated by how dry you will stay.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Things to do with kids in London when it rains',
    description,
    url: `${SITE}${path}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: picks.length,
      itemListElement: picks.slice(0, 25).map((v, i) => ({
        '@type': 'ListItem', position: i + 1, name: v.name, url: `${SITE}/venue/${slugify(v.name)}`,
      })),
    },
  };

  const inner = `
    <nav><a href="/">Wet London</a></nav>
    <h1>Things to do with kids in London when it rains</h1>
    <p>${esc(picks.length)} indoor places in London that work with children in tow, sorted by the things you actually need to know before you leave the house.</p>
    ${KIDS_EDITS.map(([h, b]) => `<h2>${esc(h)}</h2><p>${esc(b)}</p>`).join('')}
    <h2>Every family-friendly place we list</h2>
    <ul>${picks.slice(0, 60).map((v) => `<li><a href="/venue/${slugify(v.name)}">${esc(v.name)}</a></li>`).join('')}</ul>
    <p>We read this from what each venue publishes, so it is a good starting point rather than an inspection. Ring ahead if you need to be certain about a lift or a changing table.</p>`;

  let html = buildHead(template, { title, description, path, jsonLd });
  html = html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(
    breadcrumbs([['Wet London', '/'], ['With kids', path]]),
  )}</script>\n  </head>`);
  return { path, html: buildBody(html, inner) };
}

/* ---------- run ---------- */

const templatePath = join(DIST, 'index.html');
if (!existsSync(templatePath)) {
  console.error('[prerender] dist/index.html missing. Run vite build first.');
  process.exit(1);
}
const template = readFileSync(templatePath, 'utf8');

const snapshotPath = join(DIST, 'data', 'venues.json');
if (!existsSync(snapshotPath)) {
  console.warn('[prerender] no venue snapshot, skipping venue and category pages.');
}
const venues = existsSync(snapshotPath) ? JSON.parse(readFileSync(snapshotPath, 'utf8')) : [];

const pages = [];

// Venue pages, deduplicated by slug so two venues of the same name cannot
// clobber one another's file.
const seen = new Set();
for (const v of venues) {
  const slug = slugify(v.name);
  if (!slug || seen.has(slug)) continue;
  seen.add(slug);
  pages.push(venuePage(template, v));
}

// Category pages
for (const [slug, [name, blurb]] of Object.entries(CATEGORIES)) {
  const items = venues.filter((v) => typesOf(v).includes(slug));
  pages.push(listPage(template, {
    path: `/category/${slug}`,
    h1: `${name} in London when it rains`,
    blurb,
    title: `${name} in London when it rains | Wet London`,
    description: `${blurb} ${items.length} indoor ${name.toLowerCase()} in London, rated by how dry you will stay.`,
    items,
  }));
}

// Collection pages
for (const [slug, [name, blurb]] of Object.entries(COLLECTIONS)) {
  pages.push(listPage(template, {
    path: `/collection/${slug}`,
    h1: name,
    blurb,
    title: `${name} | Wet London`,
    description: blurb,
    items: [],
  }));
}

// The kids pillar
pages.push(kidsPage(template, venues));

// Flat pages
for (const [path, [name, blurb]] of Object.entries(STATIC_PAGES)) {
  pages.push(listPage(template, {
    path,
    h1: name,
    blurb,
    title: `${name} | Wet London`,
    description: blurb,
    items: path === '/all-activities' ? venues : [],
    type: path.match(/privacy|cookies|terms|affiliate|about|contact/) ? 'WebPage' : 'CollectionPage',
  }));
}

for (const { path, html } of pages) write(path, html);

console.log(`[prerender] wrote ${pages.length} pages (${seen.size} venues, ${Object.keys(CATEGORIES).length} categories, ${Object.keys(COLLECTIONS).length} collections, ${Object.keys(STATIC_PAGES).length} flat).`);
