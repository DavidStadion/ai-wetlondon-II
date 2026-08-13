-- Refresh the homepage mosaic
--
-- Three boolean columns drive the grid at the top of the homepage:
--   spotlight   one venue, the large tile
--   featured    the smaller tiles around it
--   highlighted a separate rail further down the page
--
-- The old set had All Star Lanes twice (main branch and Stratford), so a
-- bowling chain held two of eight prime slots. It also carried Museum of
-- Illusions London, which neither affiliate network lists and which Google
-- resolves to The Cinema Museum, so it may not exist. And none of the venues
-- added on 13 August were in it.
--
-- Everything below is indoors, has a working affiliate link, and is somewhere
-- a photograph will do some work.
--
-- Check the project ref is iguspxisuudvvlcbtaxk before running.
-- Expect: a clearing UPDATE touching 12 rows, then 12 rows set.

BEGIN;

-- Clear the lot first, so this file fully defines the front page rather than
-- adding to whatever was there. Re-running it is therefore safe.
UPDATE public.venues
   SET spotlight = false, featured = false, highlighted = false
 WHERE spotlight OR featured OR highlighted;

-- The large tile. Free, indoors, and Thornhill's ceiling is the most
-- photogenic interior on the site. Also the best-paying link we have at 14.2%.
UPDATE public.venues SET spotlight = true, featured = true
 WHERE name = 'Old Royal Naval College';

-- The mosaic around it.
UPDATE public.venues SET featured = true
 WHERE name IN (
   'Cutty Sark',              -- pairs with the above as one Greenwich trip
   'Tower Bridge',            -- glass floor, and almost no Londoner has been
   'V&A East Storehouse',     -- still the best new free thing in London
   'ABBA Voyage',             -- kept from the old set, and pays 14.2%
   'Hadestown',               -- one theatre slot, so the West End is visible
   'Sky Garden',              -- free, and the view sells the whole site
   'Churchill War Rooms'      -- underground, which is the premise in one word
 );

-- The secondary rail. Kept as it was: all three are strong, indoor and central.
UPDATE public.venues SET highlighted = true
 WHERE name IN ('BFI IMAX', 'Barbican Centre', 'Barbican Library');

COMMIT;

-- Dropped from the front page, and why:
--   All Star Lanes + All Star Lanes Stratford  two slots for one bowling chain
--   Museum of Illusions London                 probably does not exist
--   Wake The Tiger                             no affiliate link, no Places match
--   Mundo Pixar                                fine, but a timed exhibition
--   V&A East Museum                            kept the Storehouse instead,
--                                              two V&A East tiles is a repeat
--   Bank of England Museum                     still listed, just no longer the
--                                              spotlight. Free and quiet is a
--                                              good story but a weak lead image.
