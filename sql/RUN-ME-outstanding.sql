-- Everything outstanding, in one file. Safe to run as a single paste.
--
-- Combines sql/new-venues-tiqets-batch2.sql and sql/new-venues-west-end.sql,
-- which were never run, plus the one Merlin attraction still missing a link.
--
-- Adds 7 venues (Tower Bridge, Tottenham Hotspur Stadium Tour, and five West
-- End shows) and links 3 more (Science Museum, Hamilton, Shrek's Adventure).
--
-- Network choice is per venue, on real commission rates: Tiqets where it beats
-- GetYourGuide's flat 8%, GYG where it does not. London musicals pay about 6%
-- on Tiqets, so the five shows all go to GetYourGuide.
--
-- Check the project ref is iguspxisuudvvlcbtaxk before running.
-- Expect: 7 rows inserted, 3 rows updated.

BEGIN;

/* ================= venues and links ================= */

-- Science Museum: Tiqets 11.5%. Free to enter, so the button reads "Plan your
-- visit" rather than "Book tickets", same as the other three free museums.
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/science-museum-london-tickets-l150993/?partner=wet_london-189124'
  WHERE name = 'Science Museum';

INSERT INTO public.venues
  (name, type, location, wetness, wetness_score, price, price_display, description, rating, affiliate_link, prerequisites, opening_hours)
VALUES

-- Tiqets 11.7%, and a correction: I called Tower Bridge for GetYourGuide
-- earlier on the basis of a 6.6% entry ticket. The extended export shows the
-- tour product at 11.7%. It also turns out not to be in the catalogue at all,
-- so this is an insert rather than the update I first wrote.
('Tower Bridge',
 '{historic,museums,family}', 'central', 'dry', 10, 15.80, '£16',
 'The high-level walkways are forty metres up with a glass floor, so you can watch the traffic and the river directly beneath your shoes. The Victorian engine rooms underneath still hold the original steam machinery that lifted the bascules. Tower Hill 5 min walk.',
 4.7,
 'https://www.tiqets.com/en/tower-bridge-tickets-l141770/?partner=wet_london-189124',
 '{indoor,wheelchair accessible,lift access,family-friendly,timed entry,toilets,historic,under £20}',
 '{"mon":"09:30-18:00","tue":"09:30-18:00","wed":"09:30-18:00","thu":"09:30-18:00","fri":"09:30-18:00","sat":"09:30-18:00","sun":"09:30-18:00"}'),

-- Tiqets 10.2%
('Tottenham Hotspur Stadium Tour',
 '{sports,historic,family}', 'north', 'dry', 10, 27.00, 'FROM £27',
 'The one with the retractable pitch that rolls away to reveal an NFL field underneath. The tour gets you into the dressing rooms, the tunnel and the media areas, and almost all of it is under cover. White Hart Lane 5 min walk.',
 4.7,
 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-the-tottenham-hotspur-stadium-tour-p1017409/?partner=wet_london-189124',
 '{indoor,wheelchair accessible,step-free,lift access,family-friendly,audio guide,advance booking recommended,toilets,cafe}',
 '{"mon":"09:30-17:00","tue":"09:30-17:00","wed":"09:30-17:00","thu":"09:30-17:00","fri":"09:30-17:00","sat":"09:30-17:00","sun":"09:30-17:00"}');

/* ================= West End shows ================= */

-- Already in the catalogue with no link at all.
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-hamilton-t1049491/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Hamilton - West End';

INSERT INTO public.venues
  (name, type, location, wetness, wetness_score, price, price_display, description, rating, affiliate_link, prerequisites, opening_hours)
VALUES

('Les Misérables',
 '{theatre,music,culture}', 'central', 'dry', 10, 30.00, 'FROM £30',
 'The longest-running musical in the world, still at the Sondheim on Shaftesbury Avenue after four decades. Two hours and fifty minutes, and the barricade still works. Piccadilly Circus 5 min walk.',
 4.8,
 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-les-miserables-t992552/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue',
 '{indoor,advance booking required,evening only,timed entry,bar on-site,over 2 hours}',
 '{"mon":"19:30-22:20","tue":"19:30-22:20","wed":"14:30-22:20","thu":"19:30-22:20","fri":"19:30-22:20","sat":"14:30-22:20","sun":"Closed"}'),

('Matilda The Musical',
 '{theatre,music,family}', 'central', 'dry', 5, 24.00, 'FROM £24',
 'Tim Minchin songs, a Roald Dahl plot and a set built entirely out of alphabet blocks, at the Cambridge Theatre by Seven Dials. The one West End musical that genuinely works for children and adults at the same time. Covent Garden 3 min walk.',
 4.8,
 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-matilda-the-musical-t1044232/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue',
 '{indoor,family-friendly,child-friendly,advance booking required,timed entry,bar on-site,over 2 hours}',
 '{"mon":"Closed","tue":"19:00-21:35","wed":"19:00-21:35","thu":"14:30-21:35","fri":"19:00-21:35","sat":"14:30-21:35","sun":"15:00-17:35"}'),

('The Book of Mormon',
 '{theatre,music,comedy}', 'central', 'dry', 5, 25.00, 'FROM £25',
 'From the people who made South Park, at the Prince of Wales just off Leicester Square. Wildly rude and much warmer than its reputation suggests. Not one to take your mother to unless you know your mother. Piccadilly Circus 3 min walk.',
 4.7,
 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-the-book-of-mormon-t1048894/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue',
 '{indoor,advance booking required,evening preferred,timed entry,bar on-site,suitable for 14+,over 2 hours}',
 '{"mon":"19:30-22:00","tue":"19:30-22:00","wed":"19:30-22:00","thu":"14:30-22:00","fri":"19:30-22:00","sat":"14:30-22:00","sun":"Closed"}'),

('Hadestown',
 '{theatre,music,culture}', 'central', 'dry', 5, 33.00, 'FROM £33',
 'Orpheus and Eurydice retold as New Orleans jazz in a bar at the end of the world, at the Lyric on Shaftesbury Avenue. Eight Tony awards and the best-sounding band in the West End. Piccadilly Circus 4 min walk.',
 4.9,
 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-hadestown-the-musical-t1041458/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue',
 '{indoor,advance booking required,evening preferred,timed entry,bar on-site,music lovers,over 2 hours}',
 '{"mon":"Closed","tue":"19:30-22:00","wed":"19:30-22:00","thu":"14:30-22:00","fri":"19:30-22:00","sat":"14:30-22:00","sun":"15:00-17:30"}'),

('Stranger Things: The First Shadow',
 '{theatre,entertainment,culture}', 'central', 'dry', 5, 30.00, 'FROM £30',
 'The prequel to the series, at the Phoenix on Charing Cross Road, and the stagecraft is the point: things happen in that theatre that should not be possible without a camera. Over 12s only. Tottenham Court Road 4 min walk.',
 4.8,
 'https://www.getyourguide.com/london-l57/london-s-west-end-stranger-things-the-first-shadow-ticket-t1037694/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue',
 '{indoor,advance booking required,timed entry,bar on-site,suitable for 12+,age restrictions,over 2 hours}',
 '{"mon":"Closed","tue":"19:00-22:00","wed":"19:00-22:00","thu":"13:00-22:00","fri":"19:00-22:00","sat":"13:00-22:00","sun":"Closed"}');

/* ================= the last Merlin gap ================= */
-- Shrek's Adventure was the only Merlin attraction with no link at all.
-- Tiqets 7.5% vs GYG 8%: near enough level, and this URL is verified rather
-- than guessed, which matters more than half a percentage point.
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/shreks-adventure-london-tickets-l146704/?partner=wet_london-189124'
  WHERE name = 'Shrek''s Adventure';

COMMIT;
