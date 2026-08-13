-- The tours sweep: 20 unlinked tour and transport venues
--
-- These were never swept. The earlier passes worked down by price and by famous
-- name and stopped before reaching them, so they sat with no link at all while
-- GetYourGuide sells almost every one.
--
-- Two kinds of link here, on purpose:
--   product pages  where one product clearly matches the venue
--   category pages where the venue is a commodity with dozens of near-identical
--                  variants (Jack the Ripper, Harry Potter walks). Sending the
--                  visitor to the category is better than picking a variant at
--                  random for them, and the cookie pays either way.
--
-- All GetYourGuide: Tiqets barely lists walking tours, and where it does the
-- rate is below 8%.
--
-- Check the project ref is iguspxisuudvvlcbtaxk before running.

BEGIN;

/* ---------- Thames cruises ---------- */

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-river-thames-lunch-cruise-t26664/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Thames Lunch Cruise';

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/tower-millennium-pier-l148015/thames-lunch-cruise-t22633/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Thames Afternoon Tea Cruise';

-- Category page: several evening and dinner sailings, let the visitor pick.
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/river-thames-l2707/afternoon-tea-tc297/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name IN ('Thames Dinner Cruise', 'Thames Evening Bubbly Cruise');

/* ---------- afternoon tea buses ---------- */
-- All three are the same Routemaster product sold under different names.

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-great-british-afternoon-tea-bus-tour-t860156/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name IN ('Great British Afternoon Tea Bus', 'Afternoon Tea Bus', 'Taylor Swift Afternoon Tea Bus');

/* ---------- hop-on hop-off ---------- */

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-big-bus-hop-on-hop-off-with-optional-river-cruise-t5089/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Big Bus Hop-On Hop-Off';

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-tootbus-hop-on-hop-off-bus-tour-cruise-walk-tour-t655/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Tootbus Must-See Tour';

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-tootbus-hop-on-hop-off-optional-river-cruise-t400015/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Tootbus Hop-On Hop-Off';

/* ---------- walking tours, by category ---------- */
-- Dozens of near-identical variants each. The category page is the honest link.

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/jack-the-ripper-tours-l148872/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name IN (
    'Jack the Ripper Historic Pub Tour',
    'Jack the Ripper Night Tour',
    'Jack the Ripper Whitechapel Tour'
  );

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/harry-potter-tours-l148827/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Harry Potter Walking Tour';

/* ---------- named single tours ---------- */

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/magical-london-harry-potter-guided-walking-tour-t174648/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Slow Horses Tour';

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-buckingham-palace-westminster-abbey-big-ben-tour-t617828/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name IN ('Buckingham Palace & Guard Tour', 'Changing of the Guard Tour', 'Royal Palaces Walking Tour');

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/wwii-secrets-of-westminster-churchill-s-war-rooms-t44299/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Churchill WWII Walking Tour';

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/westminster-to-greenwich-river-thames-cruise-t54028/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Westminster to Greenwich Cruise';

COMMIT;

-- Left for a later pass, each needing its own search:
--   Soho & Chinatown Food Tour, Chinatown Food Tour, Brixton Food Tour
--   Oxford Day Trip, Street Art & Spray Painting Workshop, Guided E-Bike Tour
--   Classic Bike Tour, Beer Bike Tour, Historic Pub Walking Tour
--   Illuminated River Night Boat Tour, Ted Lasso Tour Richmond, Street Art Tour
--   Gangster Walking Tour, Agatha Christie Walking Tour, Rock & Roll Walking Tour
--   Notting Hill Walking Tour, Amy Winehouse Camden Tour, Peppa Pig Bus Tour
--   Beatles Walking Tour, ABBA Voyage Transfer, Uber Boat & Cable Car Pass
--   IFS Cloud Cable Car, London Transport Museum (family day)
--
-- Worth noting separately: about twenty of the unlinked tours are walking or
-- open-top bus tours, which are outdoors. They sit oddly on a site that
-- promises you will stay dry. Linking them does not make them wetter, but
-- whether they belong in the catalogue at all is a separate question.
