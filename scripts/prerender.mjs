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
import { build } from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://wetlondon.co.uk';

/**
 * The venue copy and the collection predicates below come from the app's own
 * modules, compiled and imported rather than reimplemented here.
 *
 * venueInfo.ts already works out opening hours, transport, duration,
 * accessibility, booking and what is included for every venue, and the app has
 * always shown it to people. It simply never reached the HTML. Porting 300
 * lines into this script would have worked once and then drifted the first time
 * anyone edited the real one, which is exactly how the type[] parsing bug in
 * this file's history happened.
 *
 * collections.ts is here for the same reason: each collection is a predicate,
 * and a second hand-copied set of predicates would start disagreeing with the
 * app about which venues belong in which collection.
 */
async function loadTsModule(...segments) {
  const result = await build({
    entryPoints: [join(ROOT, ...segments)],
    bundle: true,
    format: 'esm',
    platform: 'node',
    // Mirrors the '@' alias in vite.config.ts / tsconfig.
    alias: { '@': join(ROOT, 'src') },
    // Kept in memory: a build that has to find a writable scratch directory is
    // a build with one more way to fail on someone else's machine.
    write: false,
    logLevel: 'silent',
  });
  const code = Buffer.from(result.outputFiles[0].text).toString('base64');
  return import(`data:text/javascript;base64,${code}`);
}

const venueInfo = await loadTsModule('src', 'utils', 'venueInfo.ts');
const collections = await loadTsModule('src', 'utils', 'collections.ts');
const venueTypes = await loadTsModule('src', 'utils', 'venueTypes.ts');
const categoryList = await loadTsModule('src', 'utils', 'categories.ts');

/* ---------- shared copy, kept in step with the app ---------- */

/*
 * Shape kept as { slug: [label, blurb] } because the rest of this file reads it
 * that way, but the data now comes from src/utils/categories.ts so the footer,
 * the sitemap and these pages cannot disagree about what a category is.
 */
const CATEGORIES = Object.fromEntries(
  categoryList.CATEGORIES.map((c) => [c.slug, [c.label, c.blurb]]),
);

const COLLECTION_COPY = {
  'chucking-it-down': ['Brilliant when it is chucking it down', 'The places that work hardest on the worst days. Straight off the tube, fully covered, and good enough to make you glad it rained.'],
  'with-a-scoreboard': ['Somewhere with a scoreboard', 'Darts, bowling, shuffleboard, crazy golf, ping pong, axe throwing and simulated Formula One. Most of it has a bar attached, none of it asks you to be any good, and all of it is indoors. London has quietly filled its basements and railway arches with ways to lose at something.'],
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
  '/situations': ['Pick your vibe', 'Indoor London sorted by the kind of day you are having: on your own, as a couple, with kids, in a group, step-free, or on a budget.'],
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

/** Trim to a length a search result will actually show, on a word boundary. */
const clamp = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  return `${t.slice(0, t.lastIndexOf(' ', n - 1))}...`;
};

/** 2026-08-12 becomes 12 August 2026. Mirrors formatDate() in ArticlesPage. */
const prettyDate = (iso) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
};

const AREA = { central: 'Central London', north: 'North London', south: 'South London', east: 'East London', west: 'West London' };

/**
 * The snapshot stores `type` exactly as Postgres returns it, which is a string
 * like "{museums,education}" rather than a JSON array. Mirrors toTypeArray()
 * in src/utils/supabase.ts.
 */
function typesOf(v) {
  const raw = v.type;
  if (Array.isArray(raw)) return raw.map((t) => venueTypes.canonicalType(t));
  if (typeof raw !== 'string') return [];
  return raw
    .replace(/^[{]+/, '')
    .replace(/[}]+$/, '')
    .split(',')
    .map((s) => venueTypes.canonicalType(s.replace(/^"|"$/g, '')))
    .filter(Boolean);
}

const label = (t) => (CATEGORIES[t] ? CATEGORIES[t][0] : t);

/** Mirrors toTagArray() in src/utils/supabase.ts. */
function tagsOf(raw) {
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean);
  if (typeof raw !== 'string') return [];
  return raw
    .replace(/^[{]+/, '')
    .replace(/[}]+$/, '')
    .split(',')
    .map((s) => s.trim().replace(/^"|"$/g, ''))
    .filter(Boolean);
}

/**
 * Snapshot row to the camelCase shape venueInfo expects. A trimmed
 * convertVenue(): only the fields those helpers actually read.
 */
function toVenue(v) {
  const price = parseFloat(String(v.price)) || 0;
  const raw = v.price_display;
  const hasDisplay = raw && !/^[\d.]+$/.test(String(raw).trim());
  return {
    name: v.name,
    type: typesOf(v),
    location: v.location,
    wetness: v.wetness,
    wetnessScore: Number(v.wetness_score) || 0,
    price,
    priceDisplay: hasDisplay ? raw : price === 0 ? 'FREE' : `£${Math.round(price)}`,
    description: v.description || '',
    rating: parseFloat(String(v.rating)) || 4.5,
    prerequisites: tagsOf(v.prerequisites),
    openingHours: v.opening_hours || null,
  };
}

const li = (items) => items.map((s) => `<li>${esc(s)}</li>`).join('');

function dryness(score) {
  if (score <= 10) return 'you will stay bone dry';
  if (score <= 40) return 'you will stay mostly dry';
  return 'expect to get a bit wet getting there';
}

/** Swap a tag's attribute value in the template. */
function replaceTag(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

function buildHead(html, { title, description, path, jsonLd, ogType, noindex }) {
  const url = `${SITE}${path}`;
  let out = html;

  out = replaceTag(out, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  if (noindex) {
    out = out.replace('</head>', '    <meta name="robots" content="noindex">\n  </head>');
  }
  if (ogType) {
    out = replaceTag(out, /(<meta property="og:type" content=")[^"]*(")/, `$1${ogType}$2`);
  }
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

/**
 * Which other venues a venue page should link to.
 *
 * Every venue page used to carry four internal links: the logo, /all-activities
 * twice and its category. So 341 pages sat one hop from the homepage with almost
 * nothing pointing at them and nothing leading out of them. A sitemap tells a
 * crawler a URL exists; internal links are what suggest it matters.
 *
 * Nearest first: same category in the same part of London is the genuinely
 * useful "if you liked this" list, so it is also the honest one to show a
 * reader. Sorted by rating, then name so the build is deterministic.
 */
function relatedVenues(v, all) {
  const self = slugify(v.name);
  const primary = typesOf(v).find((t) => CATEGORIES[t]);
  const rate = (x) => parseFloat(String(x.rating)) || 0;
  const byRating = (a, b) => rate(b) - rate(a) || String(a.name).localeCompare(String(b.name));

  const pool = all.filter((x) => {
    const s = slugify(x.name);
    return s && s !== self;
  });

  const nearby = primary
    ? pool.filter((x) => x.location === v.location && typesOf(x).includes(primary)).sort(byRating)
    : [];
  const nearbySet = new Set(nearby);
  const elsewhere = primary
    ? pool.filter((x) => typesOf(x).includes(primary) && !nearbySet.has(x)).sort(byRating)
    : [];

  return {
    primary,
    nearby: nearby.slice(0, 5),
    elsewhere: elsewhere.slice(0, 5),
    // Only needed when a venue has no category we build a page for, which would
    // otherwise leave it with no outbound links at all.
    sameArea: primary ? [] : pool.filter((x) => x.location === v.location).sort(byRating).slice(0, 6),
  };
}

const venueLinks = (items) =>
  `<ul>${items.map((x) => `<li><a href="/venue/${slugify(x.name)}">${esc(x.name)}</a></li>`).join('')}</ul>`;

/* ---------- page builders ---------- */

function venuePage(template, v, all) {
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

  /*
   * Everything below is what the app already shows a visitor once JavaScript
   * runs. Putting it in the HTML is not padding: it is the page's real content
   * finally reaching the people who cannot execute JavaScript.
   *
   * Deliberately omitted: getOpenStatus(). "Open now" is true at build time and
   * a lie for the next 24 hours.
   */
  const venue = toVenue(v);
  const hours = venueInfo.formatOpeningHours(venue.openingHours);
  const hasHours = Boolean(venue.openingHours);
  const transport = venueInfo.getTransportInfo(venue.description);
  const included = venueInfo.getWhatsIncluded(venue.type, venue.prerequisites);
  const goodToKnow = venueInfo.getGoodToKnow(venue);
  const primaryCat = typesOf(v).find((t) => CATEGORIES[t]);
  const related = relatedVenues(v, all);
  const catLabel = related.primary ? label(related.primary).toLowerCase() : '';
  /*
   * Rarest first, capped at three. The collections overlap heavily by design:
   * the British Museum qualifies for seven of the eight, and listing all seven
   * reads as filler and says nothing. The smallest collection a venue belongs
   * to is the most interesting thing about it, and it spreads links towards the
   * collections that fewest venues reach.
   */
  const inCollections = collections.COLLECTIONS
    .filter((c) => c.match(venue))
    .map((c) => c.slug)
    .filter((slug) => COLLECTION_COPY[slug])
    .sort((a, b) => (collectionSizes.get(a) ?? 0) - (collectionSizes.get(b) ?? 0))
    .slice(0, 3);

  const inner = `
    <nav><a href="/">Wet London</a> / <a href="/all-activities">All activities</a></nav>
    <h1>${esc(v.name)}</h1>
    <p>${esc(v.description || '')}</p>

    <h2>Visiting ${esc(v.name)}</h2>
    <ul>
      <li>Area: ${esc(area)}</li>
      ${cats.length ? `<li>Category: ${esc(cats.join(', '))}</li>` : ''}
      <li>Entry: ${esc(price)}</li>
      <li>Rain exposure: ${esc(dryness(venue.wetnessScore))}</li>
      <li>How long to allow: ${esc(venueInfo.getDuration(venue.type, venue.prerequisites))}</li>
    </ul>

    <h2>Opening hours</h2>
    ${hasHours ? `<ul>${li(hours.split('\n'))}</ul>` : `<p>${esc(hours)}</p>`}

    <h2>Getting there</h2>
    <p>${esc(transport.station)}. ${esc(transport.details)}</p>
    <p><a href="${esc(venueInfo.getGoogleMapsUrl(v.name, area))}" rel="nofollow noopener" target="_blank">Find ${esc(v.name)} on Google Maps</a></p>

    ${included.length ? `<h2>What to expect</h2><ul>${li(included)}</ul>` : ''}

    <h2>Accessibility</h2>
    <p>${esc(venueInfo.getAccessibilityText(venue.prerequisites, venue.wetness))}</p>

    <h2>Booking</h2>
    <p>${esc(venueInfo.getBookingText(venue.type, venue.prerequisites, venue.price))}</p>

    ${goodToKnow.length ? `<h2>Good to know</h2><ul>${li(goodToKnow)}</ul>` : ''}

    ${related.nearby.length ? `<h2>Other ${esc(catLabel)} in ${esc(area)}</h2>${venueLinks(related.nearby)}` : ''}
    ${related.elsewhere.length ? `<h2>More ${esc(catLabel)} across London</h2>${venueLinks(related.elsewhere)}` : ''}
    ${related.sameArea.length ? `<h2>Also indoors in ${esc(area)}</h2>${venueLinks(related.sameArea)}` : ''}

    ${inCollections.length
      ? `<p>${esc(v.name)} also turns up in ${inCollections
          .map((slug) => `<a href="/collection/${esc(slug)}">${esc(COLLECTION_COPY[slug][0])}</a>`)
          .join(' · ')}</p>`
      : ''}

    <p>More like this:
      ${primaryCat ? `<a href="/category/${esc(primaryCat)}">${esc(label(primaryCat))} in London</a> ·` : ''}
      <a href="/all-activities">every indoor activity in London</a></p>`;

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

/**
 * The homepage.
 *
 * Every other route was prerendered from the start; '/' never was. So the most
 * important page on the site served the bare template: no h1, and no copy
 * saying what Wet London is or who it is for. A crawler arriving at the front
 * door found card titles and nothing else.
 *
 * The prose below is the same argument as WelcomeBand.tsx, minus its inline
 * links, and the two need keeping in step by hand. That is the same deal as
 * KIDS_EDITS above: a shared copy module would have to carry markup for the
 * links, which is more machinery than three paragraphs deserve.
 *
 * The h1 is deliberately not the app's h1. The visible one reads off the
 * weather and changes hourly ("It is genuinely lovely out"), which is no use as
 * the page's permanent heading.
 */
const HOME_COPY = [
  'It rains here about one day in three, which is a statistic you only really feel while standing under a bus shelter working out whether the afternoon is still worth it. So everywhere on this site carries a wetness score: how much of the trip is under a roof, how far the door is from the tube, and whether you will walk in looking like you swam.',
  'It is for people who live here and have run out of ideas. For a parent with a small person and two hours to fill. For anyone whose friend is visiting on Saturday and has just seen the forecast quietly dismantle the plan.',
  'It exists because most guides to indoor London are the same twelve attractions in a different order, written by somebody who has never had to cross the city in a downpour. This one is free and there is nothing to log into.',
];

function homePage(template, allVenues, list) {
  const path = '/';
  const title = 'Wet London - Best Indoor Activities in London When It Rains';
  const free = allVenues.filter((v) => Number(v.price) === 0).length;
  const description = `${allVenues.length} indoor things to do in London, every one rated by how wet you will get on the way. ${free} of them are free.`;

  const topCategories = Object.entries(CATEGORIES)
    .map(([slug, [name]]) => ({ slug, name, n: allVenues.filter((v) => typesOf(v).includes(slug)).length }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Wet London',
    description,
    url: SITE,
    inLanguage: 'en-GB',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: allVenues.length,
      itemListElement: allVenues.slice(0, 25).map((v, i) => ({
        '@type': 'ListItem', position: i + 1, name: v.name, url: `${SITE}/venue/${slugify(v.name)}`,
      })),
    },
  };

  const inner = `
    <h1>Indoor things to do in London when it rains</h1>
    ${HOME_COPY.map((p) => `<p>${esc(p)}</p>`).join('')}
    <p>There are ${esc(allVenues.length)} places listed so far, and
      <a href="/collection/completely-free">${esc(free)} of them are free</a>.
      The <a href="/about">wetness score</a> explains itself on the about page.</p>

    <h2>Browse by category</h2>
    <ul>${topCategories.map((c) =>
      `<li><a href="/category/${esc(c.slug)}">${esc(c.name)} in London</a>: ${esc(c.n)} places</li>`).join('')}</ul>

    <h2>Collections</h2>
    <ul>${collections.COLLECTIONS.map((c) => {
      const [name] = COLLECTION_COPY[c.slug] ?? [`${c.title} ${c.titleAccent ?? ''}`.trim()];
      return `<li><a href="/collection/${esc(c.slug)}">${esc(name)}</a></li>`;
    }).join('')}</ul>

    ${list.length ? `<h2>From the blog</h2><ul>${list.slice(0, 7).map((a) =>
      `<li><a href="/blog/${esc(a.slug)}">${esc(a.title)}</a>${a.dek ? `: ${esc(a.dek)}` : ''}</li>`).join('')}</ul>` : ''}

    <h2>Everywhere else</h2>
    <ul>
      <li><a href="/all-activities">Every indoor activity in London</a></li>
      <li><a href="/kids">Things to do with kids in London when it rains</a></li>
      <li><a href="/events">What is on right now</a></li>
      <li><a href="/situations">Pick your vibe</a></li>
    </ul>`;

  return { path, html: buildBody(buildHead(template, { title, description, path, jsonLd }), inner) };
}

/* ---------- articles ---------- */

/**
 * The whole point of the articles section is that the words are in the served
 * HTML, so `inner` here is the article's real body rather than a summary of it.
 * The markdown was converted to HTML at build time by build-articles.mjs, so
 * there is nothing to parse and nothing to escape: it is our own copy, from our
 * own repo, already safe.
 */
function articlePage(template, a) {
  const path = `/blog/${a.slug}`;
  const url = `${SITE}${path}`;
  const title = `${a.title} | Wet London`;
  const description = clamp(a.dek || a.title, 158);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    description: a.dek || undefined,
    datePublished: a.date || undefined,
    dateModified: a.date || undefined,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    wordCount: a.wordCount || undefined,
    inLanguage: 'en-GB',
    author: { '@type': 'Person', name: 'Dave' },
    publisher: { '@type': 'Organization', name: 'Wet London', url: SITE },
  };

  const inner = `
    <nav><a href="/">Wet London</a> / <a href="/blog">Blog</a></nav>
    <h1>${esc(a.title)}</h1>
    ${a.dek ? `<p>${esc(a.dek)}</p>` : ''}
    <p>${esc(prettyDate(a.date))}${a.date ? ' · ' : ''}${esc(a.readingMinutes)} min read</p>
    ${a.html}
    <p><a href="/blog">More from the Wet London blog</a></p>`;

  let html = buildHead(template, { title, description, path, jsonLd, ogType: 'article' });
  html = html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(
    breadcrumbs([['Wet London', '/'], ['Blog', '/blog'], [a.title, path]]),
  )}</script>\n  </head>`);
  return { path, html: buildBody(html, inner) };
}

function blogIndexPage(template, list) {
  const path = '/blog';
  const h1 = 'Blog';
  const blurb =
    'Longer pieces about indoor London. Where to go when it is pouring, what is worth the money, and the places most people walk straight past.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Wet London: Blog',
    description: blurb,
    url: `${SITE}${path}`,
    inLanguage: 'en-GB',
    publisher: { '@type': 'Organization', name: 'Wet London', url: SITE },
    blogPost: list.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      description: a.dek || undefined,
      datePublished: a.date || undefined,
      url: `${SITE}/blog/${a.slug}`,
    })),
  };

  const inner = `
    <nav><a href="/">Wet London</a></nav>
    <h1>${esc(h1)}</h1>
    <p>${esc(blurb)}</p>
    ${list.length
      ? `<ul>${list.map((a) =>
          `<li><a href="/blog/${esc(a.slug)}">${esc(a.title)}</a>${a.dek ? `: ${esc(a.dek)}` : ''}</li>`).join('')}</ul>`
      : ''}`;

  let html = buildHead(template, {
    title: `${h1} | Wet London`,
    description: clamp(blurb, 158),
    path,
    jsonLd,
  });
  html = html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(
    breadcrumbs([['Wet London', '/'], [h1, path]]),
  )}</script>\n  </head>`);
  return { path, html: buildBody(html, inner) };
}

/**
 * dist/404.html, which Vercel serves with a real 404 status for anything that
 * is not a file.
 *
 * The matching config lives in vercel.json, which takes no comments: it cannot
 * even hold a "_comment" key, since unknown top-level properties fail schema
 * validation and kill the deployment. Only /saved and /admin are rewritten to
 * the SPA now; every other real route is prerendered and served as a file.
 *
 * Until now the catch-all rewrite sent every unknown URL to the homepage with
 * HTTP 200, so /banana and /some/made/up/path both looked like a real page to a
 * crawler. Soft 404s at that scale are a quality signal working against a site
 * that already has trouble getting indexed.
 */
function notFoundPage(template) {
  const inner = `
    <nav><a href="/">Wet London</a></nav>
    <h1>That page does not exist</h1>
    <p>The link is wrong, or the page has moved. Neither is your fault, and you are still dry.</p>
    <ul>
      <li><a href="/all-activities">Every indoor activity in London</a></li>
      <li><a href="/collections">Collections</a></li>
      <li><a href="/blog">The blog</a></li>
      <li><a href="/">Start again from the homepage</a></li>
    </ul>`;

  return buildHead(buildBody(template, inner), {
    title: 'Page not found | Wet London',
    description: 'That page does not exist. Try the full list of indoor activities in London instead.',
    path: '/404',
    noindex: true,
  });
}

/* ---------- run ---------- */

const templatePath = join(DIST, 'index.html');
if (!existsSync(templatePath)) {
  console.error('[prerender] dist/index.html missing. Run vite build first.');
  process.exit(1);
}
const template = readFileSync(templatePath, 'utf8');

/*
 * dist/index.html is both the template every page is built from and the file the
 * homepage is now written to. A second run without a fresh vite build would read
 * its own output: the empty <div id="preact-root"></div> that buildBody() looks
 * for would already be full, so no page would receive its content and the script
 * would cheerfully report success for all 388 of them.
 */
if (template.includes('data-prerender')) {
  console.error('[prerender] dist/index.html is already prerendered. Run `npm run build` first.');
  process.exit(1);
}

const snapshotPath = join(DIST, 'data', 'venues.json');
if (!existsSync(snapshotPath)) {
  console.warn('[prerender] no venue snapshot, skipping venue and category pages.');
}
const venues = existsSync(snapshotPath) ? JSON.parse(readFileSync(snapshotPath, 'utf8')) : [];

// The shape the app's own helpers and collection predicates expect.
const venueObjects = venues.map(toVenue);

// How many venues each collection holds, so a venue page can lead with the
// most distinctive collections it belongs to rather than the broadest.
const collectionSizes = new Map(
  collections.COLLECTIONS.map((c) => [c.slug, venueObjects.filter((v) => c.match(v)).length]),
);

const articlesPath = join(DIST, 'data', 'articles.json');
if (!existsSync(articlesPath)) {
  console.warn('[prerender] no articles.json, skipping the blog section.');
}
const articles = existsSync(articlesPath) ? JSON.parse(readFileSync(articlesPath, 'utf8')) : [];

const pages = [];

// Venue pages, deduplicated by slug so two venues of the same name cannot
// clobber one another's file.
const seen = new Set();
for (const v of venues) {
  const slug = slugify(v.name);
  if (!slug || seen.has(slug)) continue;
  seen.add(slug);
  pages.push(venuePage(template, v, venues));
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

// Collection pages.
//
// These used to be built with an empty item list, so all eight were a heading
// and a paragraph that linked to nothing: in the sitemap, but a dead end for
// anyone arriving and for anything crawling. The membership test is the app's
// own predicate, so the page and the app cannot disagree about what belongs.
//
// Driven by the app's own COLLECTIONS rather than the copy map below it, so a
// collection added to collections.ts always gets a page. The sitemap derives its
// slugs from that same list, and the two disagreeing would mean declaring URLs
// that were never built. COLLECTION_COPY supplies the hand-written headline
// where there is one, and the app's own title falls in behind it.
for (const c of collections.COLLECTIONS) {
  const [name, blurb] = COLLECTION_COPY[c.slug]
    ?? [`${c.title} ${c.titleAccent ?? ''}`.trim(), c.blurb];
  pages.push(listPage(template, {
    path: `/collection/${c.slug}`,
    h1: name,
    blurb,
    title: `${name} | Wet London`,
    description: blurb,
    items: collections.venuesFor(c, venueObjects),
  }));
}

// The homepage, which until now was the only route with no prerendered body
pages.push(homePage(template, venues, articles));

// The kids pillar
pages.push(kidsPage(template, venues));

// The blog section: index plus one page per article, each carrying its full
// text rather than a summary.
if (articles.length) {
  pages.push(blogIndexPage(template, articles));
  for (const a of articles) pages.push(articlePage(template, a));
}

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

// Not a route, so it is written directly rather than as <path>/index.html.
writeFileSync(join(DIST, '404.html'), notFoundPage(template));

console.log(`[prerender] wrote ${pages.length} pages (${seen.size} venues, ${Object.keys(CATEGORIES).length} categories, ${collections.COLLECTIONS.length} collections, ${Object.keys(STATIC_PAGES).length} flat, ${articles.length} articles).`);
for (const a of articles) console.log(`[prerender] /blog/${a.slug}: ${a.wordCount} words of real HTML`);
