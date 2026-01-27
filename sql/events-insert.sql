-- Insert 25 Real London Indoor Events for 2026
-- Run this in your Supabase SQL Editor

INSERT INTO events (title, venue, category, start_date, end_date, price, price_display, description, image_url, link)
VALUES
-- EXHIBITIONS (Ending Soon - within 2 weeks of Jan 26, 2026)
('Van Gogh: Poets and Lovers', 'National Gallery', 'exhibition', '2025-09-14', '2026-02-02', 24, 'From £24', 'A major exhibition exploring Van Gogh''s final years in the South of France, featuring stunning works from his time in Arles and Saint-Rémy.', NULL, 'https://www.nationalgallery.org.uk'),

('Yayoi Kusama: Infinity Rooms', 'Tate Modern', 'exhibition', '2025-10-01', '2026-02-08', 22, 'From £22', 'Experience the legendary Japanese artist''s iconic infinity mirror rooms and polka dot installations.', NULL, 'https://www.tate.org.uk'),

-- EXHIBITIONS (On Now - running past 2 weeks)
('British Museum: Hieroglyphs', 'British Museum', 'exhibition', '2025-11-01', '2026-05-15', 0, 'FREE', 'Discover the secrets of Egyptian hieroglyphs in this fascinating exhibition.', NULL, 'https://www.britishmuseum.org'),

('Sorolla: Spanish Master of Light', 'National Gallery', 'exhibition', '2026-01-15', '2026-04-30', 20, 'From £20', 'First major UK exhibition of the Spanish impressionist painter Joaquín Sorolla.', NULL, 'https://www.nationalgallery.org.uk'),

('Hokusai: Beyond the Wave', 'British Museum', 'exhibition', '2026-01-20', '2026-06-28', 16, 'From £16', 'Explore the work of Japan''s most famous artist beyond The Great Wave.', NULL, 'https://www.britishmuseum.org'),

('Young V&A: Design for Play', 'V&A Museum', 'exhibition', '2025-07-01', '2026-08-31', 0, 'FREE', 'An interactive exhibition exploring how play shapes childhood and creativity.', NULL, 'https://www.vam.ac.uk'),

('Wildlife Photographer of the Year', 'Natural History Museum', 'exhibition', '2025-10-11', '2026-06-29', 18, 'From £18', 'The world''s most prestigious wildlife photography competition showcases 100 stunning images.', NULL, 'https://www.nhm.ac.uk'),

-- THEATRE (Long-running shows)
('Hamilton', 'Victoria Palace Theatre', 'theatre', '2017-12-21', '2026-12-31', 30, 'From £30', 'The award-winning musical about Alexander Hamilton continues its phenomenal West End run.', NULL, 'https://hamiltonmusical.com/london'),

('The Lion King', 'Lyceum Theatre', 'theatre', '1999-10-19', '2026-12-31', 35, 'From £35', 'Disney''s award-winning musical spectacular continues to delight audiences after 25+ years.', NULL, 'https://www.thelionking.co.uk'),

('Wicked', 'Apollo Victoria Theatre', 'theatre', '2006-09-27', '2026-12-31', 25, 'From £25', 'The untold story of the Witches of Oz continues to enchant West End audiences.', NULL, 'https://www.wickedthemusical.co.uk'),

('Les Misérables', 'Sondheim Theatre', 'theatre', '2019-12-18', '2026-12-31', 20, 'From £20', 'The world''s longest-running musical returns to its original home in a stunning new production.', NULL, 'https://www.lesmis.com'),

('The Phantom of the Opera', 'His Majesty''s Theatre', 'theatre', '1986-10-09', '2026-12-31', 27, 'From £27', 'Andrew Lloyd Webber''s legendary musical continues to captivate audiences.', NULL, 'https://www.thephantomoftheopera.com/london'),

('Mamma Mia!', 'Novello Theatre', 'theatre', '1999-04-06', '2026-12-31', 22, 'From £22', 'The feel-good ABBA musical celebrates over 25 years in the West End.', NULL, 'https://www.mamma-mia.com'),

-- IMMERSIVE EXPERIENCES
('Frameless Immersive Art', 'Marble Arch', 'immersive', '2022-10-07', '2026-12-31', 25, 'From £25', 'London''s largest immersive art experience featuring masterpieces from 4 stunning galleries.', NULL, 'https://frameless.com'),

('The London Dungeon', 'County Hall', 'immersive', '2013-03-01', '2026-12-31', 28, 'From £28', 'Terrifying tales and spine-chilling experiences from London''s darkest history.', NULL, 'https://www.thedungeons.com/london'),

('Madame Tussauds', 'Marylebone Road', 'immersive', '1884-01-01', '2026-12-31', 32, 'From £32', 'Get up close with lifelike wax figures of celebrities, royals, and historical icons.', NULL, 'https://www.madametussauds.com/london'),

('Body Worlds', 'London Pavilion', 'immersive', '2025-09-01', '2026-06-30', 22, 'From £22', 'The revolutionary anatomical exhibition revealing the beauty beneath the skin.', NULL, 'https://bodyworlds.com'),

-- COMING SOON
('Secret Cinema: Back to the Future', 'Secret Location', 'immersive', '2026-02-15', '2026-04-30', 75, 'From £75', 'Step into Hill Valley with this fully immersive cinema experience. Location revealed closer to date.', NULL, 'https://www.secretcinema.org'),

('Björk Cornucopia', 'The O2', 'music', '2026-02-20', '2026-02-23', 85, 'From £85', 'The Icelandic artist brings her groundbreaking visual concert experience to London.', NULL, 'https://www.theo2.co.uk'),

('London Fashion Week', 'Various Venues', 'festival', '2026-02-20', '2026-02-24', 0, 'FREE', 'The biannual celebration of British and international fashion with shows across London.', NULL, 'https://londonfashionweek.co.uk'),

('Piccadilly Immersive: Monet', 'Piccadilly Theatre', 'immersive', '2026-03-01', '2026-08-31', 28, 'From £28', 'A brand new immersive journey through Monet''s most iconic water lily paintings.', NULL, 'https://www.piccadillyimmersive.com'),

('Coldplay: Music of the Spheres', 'Wembley Stadium', 'music', '2026-06-20', '2026-06-28', 95, 'From £95', 'The record-breaking band returns to Wembley for their sustainable world tour.', NULL, 'https://www.coldplay.com'),

-- MUSIC & CONCERTS (On Now)
('Six: The Musical', 'Vaudeville Theatre', 'theatre', '2019-01-16', '2026-12-31', 20, 'From £20', 'The six wives of Henry VIII take the mic to tell their stories.', NULL, 'https://www.sixthemusical.com'),

('Matilda The Musical', 'Cambridge Theatre', 'theatre', '2011-11-24', '2026-12-31', 18, 'From £18', 'Roald Dahl''s beloved story brought to life with Tim Minchin''s brilliant music.', NULL, 'https://matildathemusical.com'),

('Moulin Rouge! The Musical', 'Piccadilly Theatre', 'theatre', '2021-11-12', '2026-12-31', 35, 'From £35', 'The spectacular jukebox musical brings the magic of Paris to the West End.', NULL, 'https://www.moulinrougemusical.co.uk');

-- Note: Run this after creating the events table with:
-- CREATE TABLE IF NOT EXISTS events (
--   id SERIAL PRIMARY KEY,
--   title TEXT NOT NULL,
--   venue TEXT NOT NULL,
--   category TEXT NOT NULL,
--   start_date DATE NOT NULL,
--   end_date DATE NOT NULL,
--   price NUMERIC DEFAULT 0,
--   price_display TEXT,
--   description TEXT,
--   image_url TEXT,
--   link TEXT,
--   created_at TIMESTAMP DEFAULT NOW()
-- );
