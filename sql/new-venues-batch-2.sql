-- Wet London, batch 2: 23 venues not currently listed and not already queued in
-- sql/new-venues-2026.sql (checked against both).
--
-- Chosen to fill the actual gaps in the collection rather than pile more onto
-- museums. As of the 303 currently live:
--   libraries      4 listings   (among the best free rainy-day rooms in London)
--   workshops      3
--   sports         8
--   science        5
--   north London  20   vs 186 central
--   free          82   of 303
-- Everything below is either free, non-central, or in a thin category. Fourteen
-- of the 23 are free.
--
-- Prices and hours are indicative and should be confirmed before publishing.
-- Google Places fills in photos, ratings and real hours once the name matches.
--
-- Run in the Supabase SQL editor, after sql/new-venues-2026.sql.

INSERT INTO venues (name, type, location, wetness, wetness_score, price, price_display, description, rating, featured)
VALUES

-- ── Libraries: the biggest gap, and all free ────────────────────────────────
('Peckham Library', '{libraries,architecture}', 'south', 'dry', 5, 0, 'FREE',
 'The copper-clad one that won the Stirling Prize, and the only library ever to have done it. The reading room is cantilevered out above the street: bright, quiet, and nobody minds how long you stay.', 4.5, false),

('Bethnal Green Library', '{libraries,historic}', 'east', 'dry', 5, 0, 'FREE',
 'Victorian red brick outside, chequerboard floors and a stained-glass arched ceiling inside. A working local library that happens to be beautiful.', 4.5, false),

('National Poetry Library', '{libraries,books}', 'central', 'dry', 0, 0, 'FREE',
 'Fifth floor of the Southbank Centre, and the largest collection of modern poetry anywhere. Free, open to anyone, and almost always got a spare chair.', 4.6, false),

('Guildhall Library', '{libraries,historic}', 'central', 'dry', 0, 0, 'FREE',
 'A public reference library the City has run since the 1420s. Enormous London history collection and a reading room most people walk straight past.', 4.5, false),

('Maughan Library', '{libraries,architecture}', 'central', 'dry', 5, 0, 'FREE',
 'Neo-gothic, with a twelve-sided domed reading room that looks invented. King''s College runs it, so check public access before travelling.', 4.6, false),

-- ── North London: 20 listings against 186 in the centre ────────────────────
('Alexandra Palace', '{entertainment,music,historic}', 'north', 'slightly', 15, 0, 'FREE',
 'The People''s Palace, still doing gigs, still got the Victorian theatre, and the BBC''s first television studios are upstairs. Free to wander even with nothing booked.', 4.5, false),

('Alexandra Palace Ice Rink', '{sports,family}', 'north', 'slightly', 15, 12, 'From £12',
 'A proper full-size rink under a roof, open all year. Skating is exactly the right amount of effort for a wet afternoon with children.', 4.3, false),

('The Castle Climbing Centre', '{sports,activities}', 'north', 'slightly', 15, 14, 'From £14',
 'Bouldering and ropes inside a mock Victorian castle that used to be a pumping station. Worth going for the building alone.', 4.7, false),

('Camden Arts Centre', '{galleries,arts}', 'north', 'dry', 10, 0, 'FREE',
 'Free contemporary shows in a converted library, with a garden and a good cafe. Quiet on weekdays and never overwhelming.', 4.4, false),

('Burgh House & Hampstead Museum', '{museums,historic}', 'north', 'dry', 10, 0, 'FREE',
 'A Queen Anne house with a small museum, a cafe in the basement and the air of somewhere you have got away with finding.', 4.5, false),

('Keats House', '{museums,historic,literary}', 'north', 'dry', 10, 9, 'From £9',
 'The house where he wrote Ode to a Nightingale, kept as rooms rather than displays. Small, and the better for it.', 4.5, false),

('Islington Museum', '{museums,history}', 'north', 'dry', 5, 0, 'FREE',
 'One room under the library on St John Street, telling the borough''s story properly. Twenty minutes, free, and always empty.', 4.2, false),

-- ── Workshops: three listings currently ─────────────────────────────────────
('Turning Earth', '{workshops,crafts}', 'east', 'dry', 5, 45, 'From £45',
 'Ceramics studio running taster classes where you actually throw something. You leave with a wonky bowl and a new opinion about clay.', 4.7, false),

('London Glassblowing', '{workshops,crafts,galleries}', 'south', 'dry', 5, 0, 'FREE',
 'Watch glass being blown from a few feet away in Peter Layton''s Bermondsey studio. Free to walk in and watch; making your own costs more.', 4.7, false),

-- ── Indoor water and heat, which nothing in the list covers ─────────────────
('Ironmonger Row Baths', '{wellness,historic,sports}', 'central', 'dry', 5, 20, 'From £20',
 'Restored 1930s Turkish baths with the original hot rooms, plus a swimming pool next door. The most pleasant possible response to a downpour.', 4.4, false),

('Porchester Spa', '{wellness,historic}', 'west', 'dry', 5, 32, 'From £32',
 'Art deco Turkish baths in Bayswater, run by the council, largely unchanged since 1929. Steam rooms, a plunge pool, and no music.', 4.3, false),

('VauxWall Climbing', '{sports,activities}', 'south', 'dry', 5, 13, 'From £13',
 'Bouldering under the railway arches at Vauxhall, with a cafe that treats coffee seriously. Trains rumble overhead, which is part of it.', 4.6, false),

-- ── Science and small collections ───────────────────────────────────────────
('Royal Institution', '{science,museums,historic}', 'central', 'dry', 0, 0, 'FREE',
 'Faraday''s basement laboratory, preserved, plus the lecture theatre where the Christmas Lectures happen. Ten elements were discovered in this building.', 4.5, false),

('Petrie Museum of Egyptian Archaeology', '{museums,history}', 'central', 'dry', 0, 0, 'FREE',
 'Eighty thousand objects crammed into cabinets at UCL, lit like a stockroom. One of the great Egyptian collections and almost nobody goes.', 4.6, false),

('Wiener Holocaust Library', '{libraries,history}', 'central', 'dry', 0, 0, 'FREE',
 'The oldest Holocaust archive in the world, with free exhibitions on the ground floor. Quiet, serious, and open to anyone who walks in.', 4.7, false),

('Musical Museum', '{museums,music}', 'west', 'dry', 5, 13, 'From £13',
 'Self-playing pianos, orchestrions and a Wurlitzer that rises out of the floor, all demonstrated rather than just displayed. Brentford, and worth the trip.', 4.6, false),

-- ── New for 2026, confirmed open ────────────────────────────────────────────
('V&A East Museum', '{museums,galleries,exhibitions}', 'east', 'dry', 0, 0, 'FREE',
 'The Stratford sibling of the Storehouse, opened this April: five hundred-odd objects you can handle and a proper focus on Black British music.', 4.6, true),

('Mundo Pixar', '{entertainment,family,immersive}', 'north', 'dry', 0, 24, 'From £24',
 'Walk-through recreations of the Pixar films at Wembley, built at full scale. Aimed squarely at children and entirely undamaged by rain.', 4.4, true);


-- ── Not added yet, deliberately ─────────────────────────────────────────────
-- London Museum (Smithfield) opens 28 November 2026. It is the biggest London
-- museum opening in decades, a £437m conversion of the Victorian General
-- Market, and it will be free. It is left out because listing somewhere as open
-- when it is not is the one thing this site cannot afford to get wrong.
--
-- It is worth a "coming soon" slot of its own nearer the date, and it is a real
-- editorial opportunity: being the guide that covers it properly on opening
-- week is exactly the kind of thing that earns links.
