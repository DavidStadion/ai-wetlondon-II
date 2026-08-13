-- Five West End shows, plus a link for Hamilton
--
-- All on GetYourGuide, not Tiqets. The catalogue export shows Tiqets paying
-- about 6% on London musicals, below GetYourGuide's flat 8%, which inverts the
-- pattern that held for museums and attractions. The existing GYG links on
-- Lion King, Phantom, Wicked, Moulin Rouge and The Mousetrap are therefore
-- already correct and are left alone.
--
-- Theatre is indoor by definition and the site already lists seven shows, so
-- these slot into an established pattern rather than opening a new one.
--
-- Check the project ref is iguspxisuudvvlcbtaxk before running.

BEGIN;

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

COMMIT;

-- Not included, and why:
--   SIX (9.1%) and Beetlejuice (9.2%) are the only two shows where Tiqets
--   beats GYG, but neither resolves cleanly from outside: search returns the
--   Broadway productions. Worth doing by hand in the Tiqets link generator.
--
--   Mamma Mia! The Musical and Magic Mike Live are already in the catalogue
--   with no link. Neither returned a confident GYG product URL, so they are
--   left rather than pointed at a guess.
--
--   Cabaret at the Kit Kat Club and Oliver! are both on GetYourGuide but the
--   search did not surface their product URLs. Next pass.
