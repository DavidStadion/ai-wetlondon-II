-- GetYourGuide links, batch 2: the famous unlinked attractions
-- All 11 had no link at all, so nothing is being replaced.
-- Check the project ref is iguspxisuudvvlcbtaxk before running.

BEGIN;

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/tower-of-london-l2708/london-tower-of-london-and-crown-jewels-exhibition-ticket-t21253/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 80;  -- Tower of London

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-madame-tussauds-london-t174429/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 72;  -- Madame Tussauds

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/the-london-eye-l2711/coca-cola-london-eye-standard-or-fast-track-admission-t170451/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 74;  -- London Eye

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/westminster-abbey-l2710/london-westminster-abbey-entrance-ticket-t399163/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 81;  -- Westminster Abbey

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/windsor-castle-entrance-ticket-t53858/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1640;  -- Windsor Castle

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/skip-the-line-st-paul-s-cathedral-with-discounted-admission-t19600/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 82;  -- St Paul's Cathedral

-- Churchill War Rooms: location page: GYG bundles the ticket with tours
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/churchill-war-rooms-l3192/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 88;  -- Churchill War Rooms

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/sea-life-london-aquarium-l7677/sea-life-london-entrance-ticket-t174549/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 73;  -- SEA LIFE London

-- London Aquarium: same product as SEA LIFE London, likely a duplicate venue row
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/sea-life-london-aquarium-l7677/sea-life-london-entrance-ticket-t174549/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 91;  -- London Aquarium

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/entrance-ticket-the-state-rooms-buckingham-palace-t53844/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1633;  -- Buckingham Palace State Rooms

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/hampton-court-palace-fast-track-entrance-t21254/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 83;  -- Hampton Court Palace

COMMIT;
