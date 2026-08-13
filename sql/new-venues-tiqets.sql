-- Eight new indoor venues, plus Tiqets links for the three free museums
--
-- All eight are drawn from the Tiqets London catalogue, so every one ships with
-- a working affiliate link from day one rather than waiting for a sweep.
-- Outdoor listings in that catalogue (Kew, the zoos, Thorpe Park, Chessington,
-- LEGOLAND, Up at The O2, RHS Wisley) are deliberately excluded: this site
-- promises you will stay dry.
--
-- Descriptions follow the house style: what it is, why it is worth the trip,
-- and the nearest station with a walking time, since getTransportInfo() reads
-- the station out of the description text.
--
-- Check the project ref is iguspxisuudvvlcbtaxk before running.

BEGIN;

/* ---------- the three free museums, per David's decision ---------- */
-- Free to enter, so the page shows "Plan your visit" rather than "Book
-- tickets". Tiqets sells guided tours and audio guides for these, not entry.

UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-official-national-gallery-highlights-tour-p1028778/?partner=wet_london-189124'
  WHERE name = 'National Gallery';

UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-tate-modern-official-discovery-tour-p1093739/?partner=wet_london-189124'
  WHERE name = 'Tate Modern';

UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-natural-history-museum-guided-tour-p1109406/?partner=wet_london-189124'
  WHERE name = 'Natural History Museum';

/* ---------- eight new venues ---------- */

INSERT INTO public.venues
  (name, type, location, wetness, wetness_score, price, price_display, description, rating, affiliate_link, prerequisites, opening_hours)
VALUES

-- Tiqets 14.2%, the best commission rate in the whole London catalogue
('Old Royal Naval College',
 '{historic,culture,museums}', 'east', 'dry', 5, 17.50, '£18',
 'The Painted Hall took Sir James Thornhill nineteen years and is often called Britain''s Sistine Chapel, which for once is not an exaggeration. Cutty Sark 5 min walk.',
 4.7,
 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-old-royal-naval-college-home-of-the-painted-hall-p977558/?partner=wet_london-189124',
 '{indoor,wheelchair accessible,step-free,cafe,toilets,audio guide,historic}',
 '{"mon":"10:00-17:00","tue":"10:00-17:00","wed":"10:00-17:00","thu":"10:00-17:00","fri":"10:00-17:00","sat":"10:00-17:00","sun":"10:00-17:00"}'),

-- Tiqets 11.7%
('Cutty Sark',
 '{historic,museums,family}', 'east', 'dry', 10, 18.00, '£18',
 'The last tea clipper afloat, raised on stilts so you can stand underneath the hull and look up at it. Cutty Sark 2 min walk.',
 4.7,
 'https://www.tiqets.com/en/cutty-sark-tickets-l146042/?partner=wet_london-189124',
 '{indoor,wheelchair accessible,step-free,lift access,family-friendly,cafe,toilets}',
 '{"mon":"10:00-17:00","tue":"10:00-17:00","wed":"10:00-17:00","thu":"10:00-17:00","fri":"10:00-17:00","sat":"10:00-17:00","sun":"10:00-17:00"}'),

-- Tiqets 9.1%
('The Paddington Bear Experience',
 '{entertainment,immersive,family}', 'central', 'dry', 0, 39.00, '£39',
 'An hour inside the films, helping the Brown family get ready for the Marmalade Day Festival. Sillier than you expect and completely undented by rain. Waterloo 5 min walk.',
 4.4,
 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-the-paddington-bear-experience-p1111562/?partner=wet_london-189124',
 '{indoor,family-friendly,child-friendly,timed entry,advance booking recommended,toilets,interactive}',
 '{"mon":"10:00-18:00","tue":"10:00-18:00","wed":"10:00-18:00","thu":"10:00-18:00","fri":"10:00-19:00","sat":"09:00-19:00","sun":"09:00-18:00"}'),

-- Tiqets 9.2%
('Titanic: Echoes from the Past',
 '{immersive,exhibitions,entertainment}', 'north', 'dry', 5, 25.00, '£25',
 'A VR reconstruction of the ship, including the Grand Staircase, in a Camden warehouse. You know how it ends, which somehow makes the first half worse. Camden Town 4 min walk.',
 4.2,
 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-london-titanic-echoes-from-the-past-vr-experience-p1117170/?partner=wet_london-189124',
 '{indoor,timed entry,advance booking recommended,interactive,suitable for 12+,toilets}',
 '{"mon":"Closed","tue":"11:00-19:00","wed":"11:00-19:00","thu":"11:00-19:00","fri":"11:00-20:00","sat":"10:00-20:00","sun":"10:00-19:00"}'),

-- Tiqets 9.1%
('Banksy Limitless London',
 '{galleries,exhibitions,art}', 'west', 'dry', 5, 22.50, '£23',
 'Two floors of Banksy on Old Brompton Road, unauthorised by the artist and fairly open about it. Good if you want the work without a wall to stand in front of in the rain. South Kensington 6 min walk.',
 4.7,
 'https://www.tiqets.com/en/banksy-limitless-london-tickets-l268231/?partner=wet_london-189124',
 '{indoor,timed entry,photography allowed,toilets}',
 '{"mon":"10:00-19:00","tue":"10:00-19:00","wed":"10:00-19:00","thu":"10:00-19:00","fri":"10:00-20:00","sat":"10:00-20:00","sun":"10:00-19:00"}'),

-- Tiqets 9.2%
('The Household Cavalry Museum',
 '{museums,historic,family}', 'central', 'dry', 5, 11.00, '£11',
 'A working stable you can see into through a glass partition, in a 17th-century building on Horse Guards. Eleven pounds, an hour, and the horses are right there. Westminster 6 min walk.',
 4.5,
 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-the-household-cavalry-museum-p975141/?partner=wet_london-189124',
 '{indoor,wheelchair accessible,step-free,family-friendly,under 2 hours,toilets,under £20}',
 '{"mon":"10:00-17:00","tue":"10:00-17:00","wed":"10:00-17:00","thu":"10:00-17:00","fri":"10:00-17:00","sat":"10:00-17:00","sun":"10:00-17:00"}');

/* ---------- two that already existed, so links only ---------- */
-- Both were already in the catalogue with no link at all. Caught by a name
-- check before inserting, or this file would have created duplicate rows.

-- Handel Hendrix House, Tiqets 9.2%
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-handel-hendrix-house-entry-ticket-p980682/?partner=wet_london-189124'
  WHERE name = 'Handel Hendrix House';

-- Aldwych Hidden London Tour, Tiqets 5.1%. The lowest rate we have taken, and
-- worth it: a disused tube station is about as close to this site's premise as
-- it is possible to get.
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/hidden-london-underground-tours-tickets-l272791/?partner=wet_london-189124'
  WHERE name = 'Aldwych Hidden London Tour';

COMMIT;

-- Deliberately not added:
--   Kew Gardens, London Zoo, ZSL Whipsnade, Thorpe Park, Chessington,
--   LEGOLAND, Warwick Castle, RHS Wisley, Up at The O2, Stonehenge
--     -> all outdoor, or outside London, or both
--   The London Pass, Go City, luggage storage
--     -> not places
--
-- Still to do, needs a product URL each:
--   Tower Bridge (GYG 8% beats Tiqets 6.6%), LUMINISCENCE, The King's Gallery,
--   The Royal Mews, Eltham Palace, and roughly a dozen West End musicals
--   (Matilda, Mamma Mia, Book of Mormon, Cabaret, Hadestown, Beetlejuice,
--   Stranger Things, My Neighbour Totoro, Les Miserables, Oliver!).
--   Ramses and the Pharaohs' Gold belongs in `events`, not here: it closes.
