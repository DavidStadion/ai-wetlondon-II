-- GetYourGuide links for the events table (the What's On page)
-- The venue sweep missed this surface entirely: EventCard books through
-- events.link, a separate column from venues.affiliate_link, and all five
-- running events pointed at the shows' own sites. Same partner ID,
-- cmp=wetlondon_event so GYG analytics can tell the two placements apart.
-- Check the project ref is iguspxisuudvvlcbtaxk before running.

BEGIN;

-- was: https://hamiltonmusical.com/london
UPDATE public.events SET link = 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-hamilton-t1049491/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_event'
  WHERE id = 2;  -- Hamilton

-- was: https://www.thelionking.co.uk
UPDATE public.events SET link = 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-the-lion-king-t1029897/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_event'
  WHERE id = 3;  -- The Lion King

-- was: https://frameless.com
UPDATE public.events SET link = 'https://www.getyourguide.com/london-l57/london-frameless-immersive-art-experience-t441877/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_event'
  WHERE id = 4;  -- Frameless

-- was: https://www.wickedthemusical.co.uk
UPDATE public.events SET link = 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-wicked-the-musical-t1037620/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_event'
  WHERE id = 5;  -- Wicked

-- was: https://www.thephantomoftheopera.com
UPDATE public.events SET link = 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-the-phantom-of-the-opera-t1040424/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_event'
  WHERE id = 6;  -- The Phantom of the Opera

COMMIT;
