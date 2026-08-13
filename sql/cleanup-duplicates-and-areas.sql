-- Merge five duplicate venues, and fix three invalid areas
--
-- Each pair below is one real place listed twice, which means two pages, two
-- sitemap entries and duplicate content on a site fighting to get indexed.
--
-- Which row survives is decided by two things, in order: whether an article
-- already links to its slug (deleting that would create a dead link, and the
-- site now serves real 404s), then which row holds the better data.
--
-- Check the project ref is iguspxisuudvvlcbtaxk before running.
-- Expect: 5 rows deleted, 3 rows updated, plus a few field merges.

BEGIN;

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

-- After this: 341 venues, no duplicate places, every venue reachable by the
-- area filter. The five deleted slugs will 404, which is correct: they were
-- never linked from anywhere, and a 404 beats two pages competing for the
-- same search result.
