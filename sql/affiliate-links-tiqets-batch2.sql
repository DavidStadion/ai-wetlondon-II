-- Tiqets, batch 2: moves justified by the real commission table
--
-- Rates read from the Tiqets product catalogue export. GetYourGuide is a flat
-- 8%, so anything above ~8.5% on Tiqets is worth moving and anything below is
-- worth leaving alone.
--
-- Check the project ref is iguspxisuudvvlcbtaxk before running.

BEGIN;

-- Churchill War Rooms: Tiqets 11.7% vs GYG 8%. Currently on a GYG location
-- page, so this is also an upgrade from a listing page to a real product.
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-churchill-war-rooms-entry-ticket-audio-guide-p1118150/?partner=wet_london-189124'
  WHERE name = 'Churchill War Rooms';

-- Houses of Parliament Tour: Tiqets 11.7%, and it had no link at all.
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/houses-of-parliament-tickets-l123818/?partner=wet_london-189124'
  WHERE name = 'Houses of Parliament Tour';

-- Shakespeare's Globe Exhibition: Tiqets 9.1% vs GYG 8%.
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/shakespeares-globe-theatre-tickets-l146684/?partner=wet_london-189124'
  WHERE name = 'Shakespeare''s Globe Exhibition';

-- Museum of Brands: Tiqets 9.1%, and it still had its own direct ticket link,
-- which pays nothing.
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-museum-of-brands-p1005945/?partner=wet_london-189124'
  WHERE name = 'Museum of Brands (nostalgia)';

COMMIT;

-- NOT included, deliberately. Tiqets pays 9-12% on these but all three are
-- FREE to enter, and Tiqets only sells guided tours and audio guides for them:
--   National Gallery 11.6% | Natural History Museum 11.5% | Tate Modern 9.2%
-- The venue page shows "Plan your visit" rather than "Book tickets" when a
-- venue is free, which softens it, but it would still send someone to a paid
-- product for a museum they can walk into for nothing. David's call.
