-- The tours sweep, second pass: 10 more
--
-- Food tours, music walks and the river/cable car combo. Highest remaining
-- value first: the three food tours are £69 to £75 each and were the largest
-- unlinked tickets left in the catalogue.
--
-- Check the project ref is iguspxisuudvvlcbtaxk before running.

BEGIN;

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

COMMIT;

-- Still unlinked, 13 left, each needing its own search and none worth more
-- than about £55:
--   Oxford Day Trip, Street Art & Spray Painting Workshop, Guided E-Bike Tour,
--   Classic Bike Tour, Beer Bike Tour, Ted Lasso Tour Richmond, Street Art Tour,
--   Gangster Walking Tour, Agatha Christie Walking Tour, Notting Hill Walking
--   Tour, Peppa Pig Bus Tour, ABBA Voyage Transfer,
--   London Transport Museum (family day)
