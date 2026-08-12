-- GetYourGuide affiliate links, generated 12 August 2026
-- Replaces venue-direct ticket links (which paid nothing) and fills blanks.
-- The displaced direct links are preserved in docs/venue-direct-links.md.
-- Check the project ref is iguspxisuudvvlcbtaxk before running.

BEGIN;

-- was: https://www.wickedthemusical.co.uk/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-wicked-the-musical-t1037620/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 34;  -- Wicked

-- was: https://the-crystal-maze.com/london/tickets/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/step-inside-the-game-show-the-crystal-maze-live-experience-t420831/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1466;  -- The Crystal Maze LIVE Experience London

-- ABBA Voyage: David found this one himself
-- was: https://abbavoyage.com/tickets/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-ticket-to-abba-voyage-t1098882/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1451;  -- ABBA Voyage

-- was: https://uk.thephantomoftheopera.com/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-the-phantom-of-the-opera-t1040424/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 36;  -- Phantom of the Opera

-- was: https://www.the-mousetrap.co.uk/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-the-mousetrap-t999435/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 35;  -- The Mousetrap

-- was: https://www.theviewfromtheshard.com/book-tickets/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/the-view-from-the-shard-experience-t24625/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 20;  -- The Shard Viewing Platform

-- was: https://www.thedungeons.com/london/tickets/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-dungeon-entrance-tickets-t174546/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 31;  -- London Dungeon

-- was: https://www.paradoxmuseum.com/london/tickets
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-paradox-museum-admission-ticket-t746331/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1436;  -- Paradox Museum London

-- was: https://www.shakespearesglobe.com/visit/exhibition/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/shakespeare-s-globe-exhibition-theatre-tour-t3389/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1450;  -- Shakespeare's Globe Exhibition

-- was: https://immersivegamebox.com/uk/locations/southbank/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/immersive-gamebox-60-minute-experience-t619131/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1456;  -- Immersive Gamebox Southbank

-- was: https://twistmuseum.com/tickets/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-twist-museum-ticket-t901656/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1452;  -- Twist Museum

-- was: https://mocomuseum.com/london/tickets/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/official-tickets-for-moco-modern-contemporary-art-museum-t661307/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1435;  -- Moco Museum London

-- was: https://www.ltmuseum.co.uk/visit/tickets
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-transport-museum-l7679/london-transport-museum-entrance-ticket-t300767/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 10;  -- London Transport Museum

-- was: https://www.royalalberthall.com/tickets/tours/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/royal-albert-hall-guided-tour-t96342/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1448;  -- Royal Albert Hall Tour

-- Royal Opera House Tour: location page: GYG has no single tour product
-- was: https://www.roh.org.uk/visit/tours
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/royal-ballet-and-opera-l3191/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1449;  -- Royal Opera House Tour

-- was: https://courtauld.ac.uk/gallery/plan-your-visit/tickets/
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-the-courtauld-gallery-at-somerset-house-t508452/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1440;  -- The Courtauld Gallery

-- Frameless: slug guessed from a localised URL, click to confirm it lands
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-frameless-immersive-art-experience-t441877/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 69;  -- Frameless

-- London Photoshoot: CHECK price matches £150
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-professional-photo-shoot-t45076/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1665;  -- London Photoshoot

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-6-course-luxury-dinner-bus-tour-t176220/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1668;  -- Gourmet Dinner Coach

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-warner-bros-studio-harry-potter-tour-branded-bus-t16403/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1698;  -- Warner Bros. Studio Tour (Branded Bus)

-- Warner Bros. Studio Tour (with transfers): CHECK: t52391 is a similar product, confirm this is the £99 one
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-warner-bros-studio-harry-potter-tour-with-transfers-t1155287/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1629;  -- Warner Bros. Studio Tour (with transfers)

-- Black Cab Sightseeing Tour: CHECK: several variants, confirm ~£95
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-sightseeing-taxi-tour-t607903/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1678;  -- Black Cab Sightseeing Tour

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-vip-kensington-palace-tour-and-royal-high-tea-t52953/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1688;  -- VIP Kensington Palace & High Tea

-- Windsor Stonehenge Bath Day Trip: CHECK: several variants, confirm ~£89
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/windsor-castle-stonehenge-bath-day-tour-from-london-t7319/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1694;  -- Windsor Stonehenge Bath Day Trip

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-the-lion-king-t1029897/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1660;  -- The Lion King

UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-s-west-end-ticket-to-moulin-rouge-the-musical-t1037650/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1672;  -- Moulin Rouge! The Musical

-- Soho Food Walking Tour: CHECK: several variants, confirm ~£79
UPDATE public.venues SET affiliate_link = 'https://www.getyourguide.com/london-l57/london-soho-food-tour-with-7-tastings-of-food-gems-t467482/?partner_id=3NBC6EH&utm_medium=online_publisher&cmp=wetlondon_venue'
  WHERE id = 1690;  -- Soho Food Walking Tour

COMMIT;
