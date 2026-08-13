-- Tiqets affiliate links, partner wet_london-189124
--
-- Tiqets commission runs ~14% on these against GetYourGuide's 8%, so where
-- both sell the same venue the Tiqets link is the better one. These five
-- supersede GYG links set earlier today; the GYG ones stay in the file
-- history if we ever want to switch back.
--
-- Check the project ref is iguspxisuudvvlcbtaxk before running.

BEGIN;

-- Tower of London: Tiqets pays ~14% vs GYG 8%, so this supersedes the GYG link
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-tower-of-london-p974054/?partner=wet_london-189124'
  WHERE id = 80;  -- Tower of London

-- Westminster Abbey: supersedes GYG
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-westminster-abbey-p976342/?partner=wet_london-189124'
  WHERE id = 81;  -- Westminster Abbey

-- Hampton Court Palace: supersedes GYG
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-hampton-court-palace-gardens-maze-p974055/?partner=wet_london-189124'
  WHERE id = 83;  -- Hampton Court Palace

-- London Transport Museum: supersedes GYG batch 1
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/london-attractions-c67458/tickets-for-london-transport-museum-p977691/?partner=wet_london-189124'
  WHERE id = 10;  -- London Transport Museum

-- ABBA Voyage: David generated this one, venue page not product
UPDATE public.venues SET affiliate_link = 'https://www.tiqets.com/en/abba-arena-tickets-l221030?partner=wet_london-189124'
  WHERE id = 1451;  -- ABBA Voyage

COMMIT;
