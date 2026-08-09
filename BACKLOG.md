# Wet London — Backlog

Living list. Newest work at the top of each section.

---

## Blocking launch

- [ ] **Delete 27 duplicate venues.** 303 rows hold 276 unique names. The anon key
      can't do it (RLS restricts DELETE to authenticated users and PostgREST
      returns `200 []`, so it looks like it worked). Run the SQL in the Supabase
      SQL editor, or delete via `/admin` while signed in.
      Backup: `backup/venues-duplicates-*.json`, SQL in the dedupe script output.
      - Check **British Library** (keeper says `north`, it's central/St Pancras)
      - Check **Flight Club** — may be two genuine branches, not a duplicate
- [ ] **Cookie consent banner.** The privacy and cookie policies state consent as
      the legal basis for analytics and advertising cookies, but no consent
      mechanism exists. Either add a CMP (Google's own is simplest alongside
      AdSense) or correct the policies. Required for UK/EU compliance with
      AdSense running.
- [ ] **Fill in the policy TODOs** — legal entity name and address, privacy
      contact address, GA4 retention period, jurisdiction. All marked with
      yellow highlights on the pages so they can't ship unnoticed.
- [ ] **Confirm `hello@` and `partners@wetlondon.co.uk` exist and are monitored.**
      Both are referenced across the site.

## Data quality

- [ ] **41 venues have no opening hours** (13.5%), so they can never appear under
      "Open now" and show no hours on their page. Backfill from Google Places.
- [ ] **Queer Britain Museum has `rating: 45`** — should be 4.5. The UI now hides
      out-of-range ratings, but the underlying row is still wrong.
- [ ] **Partner pop-up images are missing.** The database references
      `bread-ahead.jpg` etc. but only `placeholder.svg` was ever committed.
      Either supply the images or fall back to Places photos, as events now do.

## Product

- [ ] **Wire up the newsletter.** The footer form did nothing at all
      (`preventDefault` and no handler), so it now points at an email address
      instead. Connect Buttondown/Mailchimp and restore a real form.
- [ ] **Protect `/admin`.** It renders and fetches before asking for a login.
      Gate the route on the session instead.
- [ ] Prerender or server-render for SEO. Meta tags are now set per route, but
      they're applied client-side, so crawlers that don't execute JavaScript
      see the defaults.
- [ ] Lazy-load the Gallery and Reviews sections — they fetch Places data on
      page load even if never scrolled to.
- [ ] Swipe-to-dismiss on the activity modal on mobile.
- [ ] Sitemap is generated at build time. Submit it in Google Search Console
      once live.

## Nice to have

- [ ] Editorial collections ("Brilliant when it's chucking it down", "Under £20")
      as curated, shareable pages — the strongest remaining brand idea.
- [ ] Weather-reactive homepage copy — the hero adapts, but collections and
      rails could reorder by current conditions too.
- [ ] Real venue photography to replace Google Places where it matters most
      (the mosaic and category tiles lean hard on image quality).
