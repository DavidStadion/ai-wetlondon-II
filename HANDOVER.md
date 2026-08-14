# Wet London: session handover

Written 13 August 2026. Paste this into a new session to pick up without
re-deriving anything. Every number below was verified against the live database
and the live site, not assumed.

---

## What this is

`wetlondon.co.uk` — a guide to indoor things to do in London, rated by how wet
you will get. Preact + TypeScript + Vite SPA (**not** Next.js), CSS Modules,
`@preact/signals`, `preact-router`. Vercel serverless functions in `/api`
(vanilla JS). Supabase Postgres. Deployed on Vercel from `main`: every push
deploys.

Repo: `DavidStadion/ai-wetlondon-II` (public). Working dir
`/Users/dhstadion/projects/ai-wetlondon-aug/ai-wetlondon-II`.

**David is a product/UI designer, not a developer.** He owns the domain and
makes the design calls. Explain things in terms of what they do, not how. He
asks good questions and wants the reasoning, not reassurance. He spots real
problems: the two biggest bugs found on 13 August were both things he noticed
as a user before anyone found them in code.

**Voice matters to him more than almost anything.** Dry, self-aware, British,
undercuts itself, concrete rather than florid. Read `/about` and
`content/articles/free-and-nobody-queues.md` before writing any copy.
**No em dashes anywhere.** He had them all removed because they "look very AI".
Use colons, full stops or restructured sentences. UK English throughout.

---

## Accounts

| Service | Account | Detail |
|---|---|---|
| Supabase | `davidh@stadion.io` | **GitHub OAuth only, no password.** "Continue with GitHub" as `DavidStadion` |
| AdSense | `wetlondonofficial@gmail.com` | publisher `pub-1382628707656079`. **Rejected for "Low value content".** Do not request review yet |
| GetYourGuide | `wetlondonofficial@gmail.com` | partner ID **3NBC6EH**, flat **8%** |
| Tiqets | `wetlondonofficial@gmail.com` | partner **wet_london-189124**, **3.3% to 14.2%**, varies per product |
| Resend | `davidh@stadion.io` (org `stadion`) | domain verified, sends from `alerts@wetlondon.co.uk` |
| DNS | **Namecheap** (not Vercel) | `dns1/dns2.registrar-servers.com` |
| Google Cloud | via `wetlondonofficial@gmail.com` | project `WetLondon`, Places API only, capped 2,000/day and 60/min |

### The Supabase trap
**The live project is `wetlondon2026`, ref `iguspxisuudvvlcbtaxk`.** Two other
projects exist with more obvious names (`wet-london` = `fynsbibwygcxovbefqsl`,
and `Wet London`). Both are paused and unused. Always check the ref in the URL
before running SQL.

David runs all SQL by hand in the Supabase editor: RLS denies anonymous writes,
and PostgREST returns `200 []` when it silently refuses, so scripts must
generate SQL rather than attempt writes.

---

## Current state, verified 13 August 2026

| | |
|---|---|
| Venues | **341** |
| Earning affiliate links | **95** (GetYourGuide 63, Tiqets 32) |
| Venue-direct links, pay nothing | 35 |
| No link at all | 211 (86 are free venues with nothing to sell) |
| Venues with opening hours | **326** |
| Blog pieces | **7**, all prerendered with full text |
| Prerendered pages | 387 |
| Venue page HTML | ~146 words (was ~30) |
| Unknown URLs | real **404** (was HTTP 200) |
| Invalid `location` values | 0 |
| Homepage spotlight | Old Royal Naval College |

Last commit: `d121a10`. Tree clean, in sync with origin, all deployed.

---

## What changed on 12-13 August

**Content and SEO**
- `/blog` built from markdown in `content/articles/`, prerendered with the full
  article HTML, `BlogPosting` JSON-LD, `og:type: article`, own `sitemap-blog.xml`
- Venue pages now serve real content from `venueInfo.ts` (hours, transport,
  duration, accessibility, booking, good-to-know) instead of a 30-word summary
- Real 404s. Unknown URLs used to return 200 with the homepage
- 7 articles, 58 internal links, all validated against the live database

**Money**
- 95 earning links across two networks, chosen per venue on real commission data
- `docs/venue-direct-links.md` preserves the 51 original venue-direct links for
  chasing those schemes separately

**Bugs fixed (all found on 13 August)**
- **Customiser returned nothing for every option.** Modal offered "Wheelchair
  accessible", database stores "wheelchair accessible", filter compared exactly.
  All 27 options silently matched nothing. Now case-insensitive: wheelchair
  accessible returns 119 venues. 14 options with no data behind them were cut
- **Places API quota.** The `?q=` lookup sent no `Cache-Control`, so every
  visitor's every card ran a fresh Places search: ~48 calls per cold page view
  against a 2,000/day cap, about 41 visitors a day before images failed. Both
  API endpoints now cache at the CDN
- **Search did nothing visible.** Results sat ~5,000px down. Page now collapses
  editorial sections on search, plus a typeahead dropdown under the box
- **Search ranked badly.** "bank" returned Banksy, BFI Southbank and Gordon's
  Wine Bar (via "Embankment") before Bank of England Museum. Now relevance-ranked
- **Events page served stale hardcoded data** on any fetch failure, including a
  show that closed in April, with no error
- **`isVenueOpenNow` broke past midnight.** 44 late venues read as closed all evening
- **`hasActiveFilters` ignored `maxWetnessScore`**, so "Bone dry" filtered the
  list while the page reported no filters and offered no way to clear
- 5 duplicate venues merged, 3 invalid `location: "various"` values fixed

---

## Traps that have already caught us

1. **Postgres returns `text[]` as a literal string** (`"{museums,education}"`).
   `convertVenue` parses `type` and `prerequisites`. Anything new reading array
   columns must parse too
2. **`vercel.json` takes no comments and no unknown keys.** A `_comment` key
   fails schema validation and kills the deployment silently. This cost 25
   minutes of "why is nothing deploying"
3. **Never assume a dependency is installed because it resolves locally.**
   `esbuild` worked via npm hoisting from vite and broke the Vercel build
4. **`public/data/` is gitignored**, regenerated by `prebuild`
5. **Env vars need a redeploy** to take effect
6. **Never prefix a secret with `VITE_`** — that ships it to the browser
7. **Failure paths that report success, and successes that report failure.**
   Supabase's editor showed "Failed to fetch" for a transaction that had fully
   committed. Always verify against the data, never the message
8. **The browser preview pane can be "hidden"**, pausing `requestAnimationFrame`.
   Screenshots come back white after scrolling. That is the harness, not the site
9. **A clipping ancestor beats any z-index.** `overflow: hidden` on the hero was
   cutting off the search dropdown, which looked exactly like a stacking bug

---

## The two-network rule

GetYourGuide pays a flat **8%**. Tiqets varies per product, **3.3% to 14.2%**,
mean 8.7%. So the choice is per venue, not per network.

An earlier claim in this file that Tiqets pays "~14%" was read off the single
highest product and was wrong. Two links were moved on that basis and had to be
moved back. **Check the rate before moving anything.**

Pattern that holds: **Tiqets wins on museums and attractions, GetYourGuide wins
on West End shows** (Tiqets pays about 6% on musicals).

Rates are visible in the Tiqets Product Catalogue. Product URLs are **not**
exported, so they still have to be resolved one at a time by searching the
public web restricted to the network's domain:

```
WebSearch "venue name tickets" allowed_domains:["getyourguide.com"]
```

Both networks' product pages block automated readers (403) but are indexed, so
search finds them. For commodity products with dozens of variants (Jack the
Ripper walks, Harry Potter tours), link the **category page** rather than
picking a variant: the visitor chooses and the cookie still pays.

Attribution is cookie-based, ~30 days. Any page with the partner ID attached
earns on everything booked afterwards, so location and category pages are valid
links, and combo products do not need separate links.

---

## Outstanding

### David's jobs
1. **Search Console:** submit `sitemap-blog.xml`, request indexing on the 7 blog URLs
2. **£5 Google Cloud budget alert** (Billing → Budgets & alerts)
3. **One SQL statement:** `ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz;`
4. **Awin signup** — in progress. It hosts many UK merchants' own programmes
   including, probably, Merlin (Madame Tussauds, London Eye, SEA LIFE, London
   Dungeon, Shrek's). Direct rates may beat GYG's 8% on all five
5. **Do not click "Request review" in AdSense** until happy with the content
6. **Check the GYG and Tiqets dashboards around 27 August.** If pages get clicks
   but few bookings, the Tiqets Availability Widget is the fix, on the top ten
   earners only, consent-gated. If there are barely any clicks, the problem is
   traffic and a widget fixes nothing

### Code and content
1. **Accessibility audit of the site itself.** Never done. ActivityCard and
   CustomizeModal have two aria attributes between them. The site helps disabled
   people find venues; it should be operable by them. This is the top pick
2. **The empty AdSense slot.** It renders an empty container on every page
   because the site is unapproved, reserving a screenful of blank space. Hidden
   during search only. Worth hiding entirely until it serves something
3. **51 of 74 pages** of the Tiqets catalogue export are unread
   (`tiqets places pages 1 - 15 - Sheet1.pdf` in the repo root). I sampled eight
   and wrongly called the rest low yield
4. **13 tour venues still unlinked**, none worth more than ~£55
5. **4 shows need URLs**: SIX and Beetlejuice (Tiqets wins, but search returns
   the Broadway productions), Cabaret and Oliver!
6. **`Ramses and the Pharaohs' Gold`** belongs in `events`, not `venues`: it
   closes, and the events table self-expires
7. **Per-venue Open Graph images.** Every shared link uses the same
   `og-image.jpg`. Highest-value unbuilt thing for how the site travels on
   Instagram
8. **~20 walking and open-top bus tours are outdoors** and sit oddly on a site
   promising you will stay dry. Decide whether they belong or need a clearer
   weather-dependent treatment

---

## Useful commands

```bash
npm run build        # tsc + vite build + prerender (387 pages)
npm run snapshot     # refresh public/data from Supabase
npm run articles     # rebuild articles.json from content/articles/
node scripts/backfill-hours.mjs --limit 5   # opening hours, writes SQL
```

Reading live data without the dashboard:

```bash
set -a; . ./.env; set +a
curl -s "$VITE_SUPABASE_URL/rest/v1/venues?select=name,affiliate_link" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"
```

Two pre-existing lint errors in `ContactPage.tsx` and `HomePage.tsx` (unused
imports). Not introduced by recent work, left alone deliberately.

---

## The number that matters

**Search Console → Indexing.** It was 3 indexed pages on 11 August. That is the
scoreboard for all the content and prerendering work. If the grey "not indexed"
bar grows and the green bar stays flat after a fortnight, the problem is content
quality rather than anything technical.

And the honest second number: **95 affiliate links earn nothing until someone
clicks them.** The constraint now is traffic, not coverage. Search Console and
the Instagram plan matter more from here than link number 96.
