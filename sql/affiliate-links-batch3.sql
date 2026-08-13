-- Affiliate links, batch 3: mixed Tiqets and GetYourGuide
-- Tiqets preferred where both sell the venue (higher commission).
-- Check the project ref is iguspxisuudvvlcbtaxk before running.

BEGIN;

-- HMS Belfast Tour: Tiqets
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-hms-belfast-p1064199/?partner=wet_london-189124'
  WHERE id = 1647;  -- HMS Belfast Tour

-- Chelsea FC Stadium Tour: GYG, not on Tiqets
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/chelsea-football-club-stadium-and-museum-1-hour-tour-t52605/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1651;  -- Chelsea FC Stadium Tour

-- Wembley Stadium Tour: GYG, not on Tiqets
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/guided-wembley-stadium-tour-t12486/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1641;  -- Wembley Stadium Tour

-- Emirates Stadium Tour: GYG location page, no clean single product
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/emirates-stadium-l95402/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1636;  -- Emirates Stadium Tour

COMMIT;
