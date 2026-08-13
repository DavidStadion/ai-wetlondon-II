-- Tiqets, final batch from the extended catalogue export
--
-- Pages 16-23 of the export are mostly walking tours, day trips outside London,
-- airport lounges and combo packages of venues we already list. Low yield. Four
-- things came out of it, one of them a correction.
--
-- Check the project ref is iguspxisuudvvlcbtaxk before running.

BEGIN;

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

COMMIT;

-- Also in the extended export, NOT actioned, because they are a content
-- decision rather than a link decision: roughly a dozen West End musicals we
-- do not list, including SIX (9.1%), Beetlejuice (9.2%), Mamma Mia!, Matilda,
-- Book of Mormon, Cabaret, Hadestown, Stranger Things, My Neighbour Totoro,
-- Les Miserables and Oliver!. Theatre is indoor by definition and five shows
-- are already in the catalogue, so the pattern exists. Worth its own batch.
--
-- Everything else on pages 16-23 was walking tours, hop-on hop-off buses,
-- airport lounges, day trips to Paris, Edinburgh, the Cotswolds and the Lake
-- District, or combo packages of venues already listed.
