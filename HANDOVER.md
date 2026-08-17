# Wet London: session handover

Rewritten 14 August 2026. Paste this into a new session to pick up without
re-deriving anything. Every number below was verified against the live database,
the live site or the browser, not assumed.

**The previous version of this file was wrong in ways that cost time.** It said
venue pages served ~146 words when they served 455, and it never mentioned that
category and collection pages existed at all, which nearly led to rebuilding
something already shipped. If you change something, change the number here too.

---

## What this is

`wetlondon.co.uk` is a guide to indoor things to do in London, rated by how
wet you will get. Preact + TypeScript + Vite SPA (**not** Next.js), CSS Modules,
`@preact/signals`, `preact-router`. Vercel serverless functions in `/api`
(vanilla JS). Supabase Postgres. Deployed on Vercel from `main`: every push
deploys.

Repo: `DavidStadion/ai-wetlondon-II` (public). Working dir
`/Users/dhstadion/projects/ai-wetlondon-aug/ai-wetlondon-II`.

**David is a product/UI designer, not a developer.** He owns the domain and makes
the design calls. Explain things in terms of what they do, not how. He wants the
reasoning, not reassurance, and he spots real problems: several of the biggest
bugs found in this project were things he noticed as a user first.

**Voice matters to him more than almost anything.** Dry, self-aware, British,
undercuts itself, concrete rather than florid. Long specific sentence, then a
short one that lands. Read `/about`, `content/articles/free-and-nobody-queues.md`
and `src/components/WelcomeBand/WelcomeBand.tsx` before writing any copy.
**No em dashes anywhere.** He had them all removed because they "look very AI".
Use colons, full stops or restructured sentences. UK English throughout.

---

## Accounts

| Service | Account | Detail |
|---|---|---|
| Supabase | `davidh@stadion.io` | **GitHub OAuth only, no password.** "Continue with GitHub" as `DavidStadion` |
| Search Console | **a third account, not either one signed into Chrome** | See the trap below |
| AdSense | `wetlondonofficial@gmail.com` | publisher `pub-1382628707656079`. **Rejected for "Low value content".** Do not request review yet |
| GetYourGuide | `wetlondonofficial@gmail.com` | partner ID **3NBC6EH**, flat **8%** |
| Tiqets | `wetlondonofficial@gmail.com` | partner **wet_london-189124**, **3.3% to 14.2%**, varies per product |
| Resend | `davidh@stadion.io` (org `stadion`) | domain verified, sends from `alerts@wetlondon.co.uk` |
| DNS | **Namecheap** (not Vercel) | `dns1/dns2.registrar-servers.com` |
| Google Cloud | via `wetlondonofficial@gmail.com` | project `WetLondon`. **One key only**: `wet-london-places-new-server`, restricted to Places API (New), no application restriction (correct for a server key). Legacy Places API disabled |

### The Supabase trap
**The live project is `wetlondon2026`, ref `iguspxisuudvvlcbtaxk`.** Two other
projects exist with more obvious names (`wet-london` = `fynsbibwygcxovbefqsl`,
and `Wet London`). Both are paused and unused. Always check the ref in the URL
before running SQL.

David runs all SQL by hand in the Supabase editor: RLS denies anonymous writes,
and PostgREST returns `200 []` when it silently refuses, so scripts must generate
SQL rather than attempt writes.

### The Search Console trap
**Search Console is on a Google account that is not signed into his Chrome.** On
14 August both Chrome accounts (`authuser` 0 and 1) returned the "add your first
property" welcome screen, and requesting the property directly returned "not
verified". That looks exactly like the site never having been verified. It has
been: there is a live `google-site-verification` TXT record in Namecheap, so it
is a **domain property** (`sc-domain:wetlondon.co.uk`).

Do not conclude from an empty Search Console that nothing was set up, and do not
add a URL-prefix property to "fix" it. If the owning account is ever lost,
verifying from any account with a fresh DNS TXT record returns the *same*
property with its history: properties are shared objects, verification is
per-user.

---

## Current state, verified 14 August 2026

| | |
|---|---|
| Venues | **341**, of which **337 hold a Google `place_id`** |
| Earning affiliate links | **95** (GetYourGuide 63, Tiqets 32) |
| No affiliate link | 211 |
| Prerendered pages | **394** (341 venues, 18 categories, 9 collections, 11 flat, 12 articles, homepage) |
| Venue page HTML | ~513 words |
| Homepage HTML | **946 words**, was 293 |
| Venue-to-venue internal links | **2,945**, was 0 |
| Internal links per venue page | **52**, was 7 |
| Blog pieces | **12**, all prerendered with full text |
| Sitemaps in Search Console | 5, all Success. `sitemap-index.xml` read 14 Aug, 393 pages |

Last commit: `5c3414c`. Tree clean, in sync with origin, all deployed.

Two pre-existing lint errors in `ContactPage.tsx` and `HomePage.tsx` (unused
imports). Not introduced by recent work, left alone deliberately.

---

## What changed on 14 August

**Internal linking, the main event.** Every venue page carried four internal
links, two of which pointed at the same place. 341 pages sat with almost nothing
pointing at them and nothing leading out. A sitemap says a URL exists; internal
links are what suggest it matters, and that is the likeliest reason these pages
were known to Google and not indexed. Venue pages now carry other venues of the
same category in the same area, more of that category across London, the three
most distinctive collections the venue belongs to, and for the 32 venues with no
category page, other places in the same area.

**All 8 collection pages were built with `items: []`.** Each was a heading and a
paragraph linking nowhere, while sitting in the sitemap inviting a crawl. They
now list their venues using the app's own predicates from `src/utils/collections.ts`,
compiled and imported by the prerenderer rather than hand-copied.

**The homepage was the only route with no prerendered body**, so it had no `h1`
at all and served a crawler 293 words of nav and card titles. It now has a real
`h1`, three paragraphs and 42 links out to every category, collection and article.

**`WelcomeBand`** is the visible version of that copy, after the featured rail.
Counts come from the venue signals, so they cannot drift from the database. On
mobile only the first paragraph shows behind a "Read the rest" toggle: 582px
collapsed against 975px open.

**The ad slots were reserving ~150px of nothing on every visit.** AdSense is
unapproved so nothing can fill them. Now gated on `ADSENSE_APPROVED` in
`AdSlot.tsx` (flip it after approval) plus the presence of the AdSense script,
which `consent.ts` only loads once ads consent is granted.

**First measured accessibility pass.** Three real WCAG AA failures fixed:
OPEN NOW badge 3.49:1 to 4.99:1, CLOSED badge 4.38:1 to 5.01:1, pop-up type
3.08:1 to 9.43:1. Homepage heading order no longer skips h1 to h3.

---

## What changed on 17 August

**The Places bill, which was the urgent thing.** £41.31 went on Places between 1
and 16 August: roughly £27 on working out which place each venue is, £14.26 on
serving photo bytes. The lookup half repeated on every cache miss to answer a
question about the British Museum that has the same answer every time.

`place_id` is now stored on 337 of 341 venues, and photos come from a Place
Details call with an ID-only field mask, which Google bills at nothing. Proved
in practice, not just in the docs: `GetPlaceRequest` usage moved off zero the
moment the new path ran.

The four that would not resolve are `Obby Classes`, `Soho & Chinatown Food
Tour`, `Slow Horses Tour` and `Wake The Tiger`. Three are products rather than
places. Wake The Tiger is in Bristol, which is worth a look on its own terms.

**Quotas, now sized for the new architecture** (Places API (New), not the
legacy one):

| Row | Value | Why |
|---|---|---|
| `GetPlaceRequest per day` | 200 | The main lookup now. Free, ID-only mask |
| `SearchTextRequest per day` | 25 | Only the 4 unmatched venues and anything new |
| `GetPhotoMediaRequest per day` | 60 | **The only one that costs money**, 0.55p a call |

**Three API keys became one.** `wet-london-places-photos-2` matched nothing in
Vercel. `wet-london-places-photos` was restricted to HTTP referrers, which only
browsers send, so it could never have served a server-side call. Both deleted,
site verified between each. `GOOGLE_MAPS_API_KEY` removed from Vercel too.

**Five more blog pieces and a rebuilt blog index**, three treatments instead of
one repeating card. **The footer carries the whole sitemap**, 42 links, and
`siteLinks()` puts the same links into every prerendered page.

**The no-photo state was redesigned.** All 28 of its old colours failed contrast
against the white text the cards lay over them: amber gave 1.67:1 against a 4.5
requirement. Now dark ink with a rain texture, 19 tones all above 16:1.

---

## Traps that have already caught us

1. **Postgres returns `text[]` as a literal string** (`"{museums,education}"`).
   `convertVenue` parses `type` and `prerequisites`. Anything new reading array
   columns must parse too
2. **`vercel.json` takes no comments and no unknown keys.** A `_comment` key
   fails schema validation and kills the deployment silently
3. **Never assume a dependency is installed because it resolves locally.**
   `esbuild` worked via npm hoisting from vite and broke the Vercel build
4. **`public/data/` is gitignored**, regenerated by `prebuild`. The rest of
   `public/` is tracked, including the sitemaps, which the build rewrites: expect
   `lastmod` churn in `git status` after any build
5. **Env vars need a redeploy** to take effect
6. **Never prefix a secret with `VITE_`**: that ships it to the browser
7. **Failure paths that report success.** Supabase's editor showed "Failed to
   fetch" for a transaction that had fully committed. Always verify against the
   data, never the message
8. **The browser preview pane can be "hidden"**, pausing `requestAnimationFrame`.
   Screenshots come back white and `computer` actions time out. That is the
   harness, not the site. Read computed styles with `javascript_tool` instead
9. **A clipping ancestor beats any z-index.** `overflow: hidden` on the hero was
   cutting off the search dropdown
10. **`dist/index.html` is both the prerender template and the homepage's own
    output file.** A second `npm run prerender` without a fresh `vite build`
    would read its own output, match no insertion point, and write 388
    contentless pages while reporting success. There is now a guard that exits
    with a message; do not remove it
11. **`200 []` from PostgREST proves nothing about a column.** To test whether a
    column exists, ask for a deliberately fake one as a control: a real absence
    returns `400` with code `42703`
12. **Contrast cannot be measured by walking up for a background colour.** Card
    text sits over photographs, so the walk reaches the page colour and reports a
    meaningless 1.09:1. Only trust readings where both sides are solid colours
13. **A quota is not a spend cap and a budget is not either.** Budgets only
    email you. The cap is per-API daily quotas, and after any architecture
    change they need resizing: moving photos onto `place_id` made
    `GetPlaceRequest` the main call while it was still capped at 5 a day, which
    would have silently failed back to the paid search
14. **An HTTP-referrer restriction cannot work server-side.** Browsers send a
    referrer, servers do not. A key restricted that way is dead weight for a
    Vercel backend, whatever its name suggests
15. **`encodeURIComponent` leaves `'`, `(` and `)` alone**, none of which are
    legal in an unquoted CSS `url()`. Preact assigns style properties straight
    onto `dom.style`, so a rejected value leaves no style attribute at all and
    every image vanishes rather than looking wrong
16. **Anything in a component reaches people, not crawlers.** The whole SEO
    architecture is the prerendered HTML in `dist/`, and the app clears it on
    hydration. The footer lives in `Layout.tsx`, so there is not a single
    `<footer>` tag anywhere in the 394 built files. Adding forty-two links to it
    looked like a site-wide internal linking win and delivered nothing to the
    prerendered layer until `siteLinks()` was added to `buildBody`. Before
    claiming any change helps search, check `dist/`, not the browser

---

## The two-network rule

GetYourGuide pays a flat **8%**. Tiqets varies per product, **3.3% to 14.2%**,
mean 8.7%. So the choice is per venue, not per network.

An earlier claim that Tiqets pays "~14%" was read off the single highest product
and was wrong. Two links were moved on that basis and had to be moved back.
**Check the rate before moving anything.**

Pattern that holds: **Tiqets wins on museums and attractions, GetYourGuide wins
on West End shows** (Tiqets pays about 6% on musicals).

Product URLs are **not** exported, so they are resolved one at a time:

```
WebSearch "venue name tickets" allowed_domains:["getyourguide.com"]
```

Both networks' product pages block automated readers (403) but are indexed, so
search finds them. For commodity products with dozens of variants, link the
**category page**: the visitor chooses and the cookie still pays. Attribution is
cookie-based, ~30 days.

---

## Outstanding

### David's jobs
1. **Check Billing → Reports → group by SKU.** The one claim not yet proved on
   the invoice: Text Search should have collapsed to near zero, Place Details
   should appear at £0, Place Photo should carry on. If Place Details shows a
   charge, the ID-only tier reading was wrong
2. **Awin signup**, in progress. Hosts many UK merchants' own programmes
   including, probably, Merlin (Madame Tussauds, London Eye, SEA LIFE, London
   Dungeon, Shrek's). Direct rates may beat GYG's 8% on all five
3. **Do not click "Request review" in AdSense** until happy with the content
4. **Check the GYG and Tiqets dashboards around 27 August**
5. **Pop-Ups**: he is unhappy with `/popups` and planning a redesign himself.
   It is currently a thin page driven by the `partners` table. Do not pre-empt it

Done and verifiable, so do not put these back on the list: the
`subscribers.confirmation_sent_at` column exists (proved with a control query,
trap 11), and `sitemap-index.xml` is submitted and read.

### The number that matters
**Search Console → Indexing → Pages.** It was 3 indexed pages on 11 August.
Nothing else should be optimised until this is readable, which needs about a
fortnight from 14 August for Google to recrawl 341 venue pages that now have
2,945 internal links between them.

- If indexed climbs off 3, the linking worked. Do more of it
- If it stays flat, the problem was never technical and no further plumbing will
  fix it. The answer is content quality and traffic

### Code and content, in the order I would take them
1. **Per-venue Open Graph images.** Every shared link still uses the same
   `og-image.jpg`. Highest-value unbuilt thing for how the site travels on
   Instagram, and it works without anyone posting daily. Needs a real build step
   (satori/resvg or similar), so mind trap 3
2. **Finish the accessibility audit.** The 14 August pass was contrast and
   heading order only. Untouched: keyboard traversal, focus visibility, modal
   focus traps, and whether the scrims behind white card text are strong enough
   (trap 12 means this needs eyes, not a script)
3. **The collections are too broad to be curation.** Measured membership:
   `chucking-it-down` 198 of 341, `date-night` 131, `escape-the-heat` 128,
   `somewhere-weird` 127, `quiet-please` 117, `under-a-tenner` 109,
   `with-little-ones` 109, `completely-free` 88. Tightening the predicates in
   `src/utils/collections.ts` is an editorial decision and **David's call**
4. **51 of 74 pages** of the Tiqets catalogue export are unread
   (`tiqets places pages 1 - 15 - Sheet1.pdf`, also a Google Sheet). The value in
   it is **better rates on venues already listed**, not new venues: adding venue
   342 earns nothing while traffic is the constraint
5. **4 shows need URLs**: SIX and Beetlejuice (Tiqets wins, but search returns
   the Broadway productions), Cabaret and Oliver!
6. **13 tour venues still unlinked**, none worth more than ~£55
7. **`Ramses and the Pharaohs' Gold`** belongs in `events`, not `venues`: it
   closes, and the events table self-expires
8. **~20 walking and open-top bus tours are outdoors** and sit oddly on a site
   promising you will stay dry. A design decision, not a bug

---

## Useful commands

```bash
npm run build        # tsc + vite build + prerender (388 pages). Run this, not prerender alone
npm run typecheck    # tsc only
npm run lint         # 2 pre-existing errors, see above
npm run snapshot     # refresh public/data from Supabase
npm run articles     # rebuild articles.json from content/articles/
```

Reading live data without the dashboard:

```bash
set -a; . ./.env; set +a
curl -s "$VITE_SUPABASE_URL/rest/v1/venues?select=name,affiliate_link" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"
```

Preview servers are named in `.claude/launch.json` at the **parent** directory,
not in the repo: `wetlondon-dev` (5173) and `wetlondon-preview` (4173).

---

## The honest summary

The site is in good technical shape and that is no longer the constraint. 95
affiliate links earn nothing until someone clicks them, and the structural work
finished on 14 August cannot be judged for a fortnight. Search Console and the
Instagram plan matter more from here than link number 96.

He has a newborn. Do not invent urgent work.
