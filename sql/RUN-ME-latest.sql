-- Everything outstanding for Supabase, in one paste.
--
-- Combines sql/affiliate-links-tours-2.sql and
-- sql/cleanup-duplicates-and-areas.sql. Checked against the live database:
-- affiliate-links-tours.sql has already been run, so it is not included here.
--
-- The two do not overlap: nothing the cleanup deletes is linked by the tours
-- file, so the order does not matter. Links are applied first anyway.
--
-- Check the project ref is iguspxisuudvvlcbtaxk before running.
-- Expect: 10 links set, 5 rows deleted, 3 areas fixed. 346 venues -> 341.

BEGIN;

/* ================= 1. ten more tour links ================= */

/* ---------- food tours, the biggest remaining tickets ---------- */

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-s-best-bites-soho-chinatown-food-walking-tour-t943039/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Soho & Chinatown Food Tour';

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-soho-food-tour-with-7-tastings-of-food-gems-t467482/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Chinatown Food Tour';

-- Category page: Brixton's is Obi's African & Caribbean tour, which did not
-- surface a clean product URL. Street food covers it and lets the visitor pick.
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/streetfood-tc248/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Brixton Food Tour';

/* ---------- music walks ---------- */

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-beatles-and-abbey-road-tour-with-richard-porter-t445767/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Beatles Walking Tour';

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-amy-winehouse-camden-town-walking-tour-t974418/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Amy Winehouse Camden Tour';

-- Category page: several rock and pop history walks, no single obvious match.
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/music-history-tours-tc2012/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Rock & Roll Walking Tour';

/* ---------- river and cable car ---------- */
-- Tiqets sells these as one product, which is exactly what both venues are.

UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-uber-boat-by-thames-clipper-one-day-hop-on-hop-off-ifs-cloud-cable-car-p976738/?partner=wet_london-189124'
  WHERE name = 'Uber Boat & Cable Car Pass';

UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-uber-boat-by-thames-clippers-single-trip-journey-and-ifs-cloud-cable-car-p1026059/?partner=wet_london-189124'
  WHERE name = 'IFS Cloud Cable Car';

/* ---------- the rest of the Thames ---------- */

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-thames-river-evening-cruise-t399855/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Illuminated River Night Boat Tour';

/* ---------- pub walks ---------- */

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/jack-the-ripper-tours-l148872/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Historic Pub Walking Tour';

/* ================= 2. merge duplicates, fix areas ================= */

/* ---------- 1. London Aquarium / SEA LIFE London ---------- */
-- Keep #91 London Aquarium: the blog piece "cool-dark-and-out-of-the-sun"
-- links to /venue/london-aquarium. It also has the better transport line
-- (Waterloo is genuinely closer to County Hall than Westminster).
-- Take the affiliate link across first in case they ever differ.
UPDATE public.venues
   SET affiliate_link = COALESCE(
         (SELECT affiliate_link FROM public.venues WHERE id = 73),
         affiliate_link)
 WHERE id = 91;
DELETE FROM public.venues WHERE id = 73;   -- SEA LIFE London

/* ---------- 2. Postal Museum / The Postal Museum ---------- */
-- Keep #102 The Postal Museum: correct official name, and its description
-- mentions the Mail Rail, which is the actual reason to go.
DELETE FROM public.venues WHERE id = 1483; -- Postal Museum

/* ---------- 3. Wallace Collection / The Wallace Collection ---------- */
-- Keep #1512 The Wallace Collection: correct official name, better
-- description, and the "mate-visiting" piece links to
-- /venue/the-wallace-collection.
DELETE FROM public.venues WHERE id = 113;  -- Wallace Collection

/* ---------- 4. Crystal Maze ---------- */
-- Keep #1466: full name and it already earns.
DELETE FROM public.venues WHERE id = 1496; -- Crystal Maze LIVE

/* ---------- 5. Grant Museum of Zoology ---------- */
-- Keep #1478: proper name, and "stranger-than-it-lets-on" links to
-- /venue/grant-museum-of-zoology.
DELETE FROM public.venues WHERE id = 1552; -- Grant Museum of Zoology (quick visit)

/* ---------- invalid areas ---------- */
-- location must be one of central/north/south/east/west. "various" is not a
-- valid AreaType, so these three vanished whenever anyone filtered by area.
-- All three are chains; the listed branch decides the area.
UPDATE public.venues SET location = 'central' WHERE name = 'Everyman Cinema';
UPDATE public.venues SET location = 'central' WHERE name = 'Sixes Cricket';
UPDATE public.venues SET location = 'central' WHERE name = 'Escape Hunt';

COMMIT;
