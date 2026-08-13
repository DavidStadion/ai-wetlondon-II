-- Rebalance GetYourGuide vs Tiqets against real commission rates
--
-- The Tiqets product catalogue shows a per-product commission, and it varies a
-- lot: 3.3% to 14.2%, mean 8.7%. My earlier "~14%" was read off the single
-- highest product (ABBA) and was wrong as a general rate. GetYourGuide is a
-- flat 8%, so each venue is a straight comparison.
--
-- Two links moved to Tiqets yesterday were losing money and move back.
--
-- Check the project ref is iguspxisuudvvlcbtaxk before running.

BEGIN;

-- ---------- MOVE BACK TO GETYOURGUIDE (Tiqets pays less than 8%) ----------

-- Westminster Abbey: Tiqets 5.2%, GYG 8%. My mistake yesterday.
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/westminster-abbey-l2710/london-westminster-abbey-entrance-ticket-t399163/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'Westminster Abbey';

-- HMS Belfast: Tiqets 3.3%, GYG 8%. The worst rate in the whole catalogue.
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-hms-belfast-entrance-ticket-t174548/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE name = 'HMS Belfast Tour';

-- ---------- MOVE TO TIQETS (pays more than GYG's 8%) ----------

-- St Paul's Cathedral: Tiqets 9.2%
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-st-pauls-cathedral-p974057/?partner=wet_london-189124'
  WHERE name = 'St Paul''s Cathedral';

-- Emirates Stadium Tour: Tiqets 9.2%, and a real product rather than the GYG
-- location page it currently points at.
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-arsenal-fc-emirates-stadium-tour-p1010325/?partner=wet_london-189124'
  WHERE name = 'Emirates Stadium Tour';

-- Chelsea FC Stadium Tour: Tiqets 9.1%
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-stamford-bridge-guided-tour-chelsea-fc-museum-entry-p1013894/?partner=wet_london-189124'
  WHERE name = 'Chelsea FC Stadium Tour';

-- Paradox Museum London: Tiqets 9.2%
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/paradox-museum-tickets-l249824/?partner=wet_london-189124'
  WHERE name = 'Paradox Museum London';

-- Moco Museum London: Tiqets 11.7%, one of the best rates available
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-moco-museum-london-p1000454/?partner=wet_london-189124'
  WHERE name = 'Moco Museum London';

-- Royal Observatory Greenwich: Tiqets 11.7%
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-royal-observatory-greenwich-p974408/?partner=wet_london-189124'
  WHERE name = 'Royal Observatory Greenwich';

-- Warner Bros. Studio Tour: Tiqets 11.6% against GYG 8% on a £130 product,
-- the single biggest per-booking difference on the site.
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-harry-potter-warner-bros-studio-london-entry-transfer-from-london-p1015393/?partner=wet_london-189124'
  WHERE name = 'Warner Bros. Studio Tour (with transfers)';

COMMIT;

-- Left on GetYourGuide deliberately, because Tiqets pays less than 8% on them:
--   London Eye 7.5% | The Shard 7.5% | Madame Tussauds 7.4% | London Dungeon 7.4%
--   SEA LIFE 7.4% | Buckingham Palace 6.7% | Windsor Castle 6.7% | Tower Bridge 6.6%
--
-- Already on Tiqets and correctly so:
--   ABBA Voyage 14.2% | Tower of London 9.1% | Hampton Court 9.1%
--   London Transport Museum 8.6%
