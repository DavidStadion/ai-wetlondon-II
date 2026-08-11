-- Wet London, batch 3: 21 venues, checked against the live 312 and both earlier
-- batches. No collisions.
--
-- This batch fixes a different gap from the last one. The museum coverage is
-- close to exhaustive, but the DOING end of the catalogue was nearly empty. Of
-- the 312 live venues there was no bowling, no karaoke, no darts, no soft play,
-- no swimming, no pottery or cookery, no board game cafe, no planetarium, and
-- comedy had four listings against fifty-nine museums.
--
-- That is the actual gap for a wet Saturday: not another collection to look at,
-- something to do with your hands for two hours.
--
-- Also shifts the geography: 8 central against 13 elsewhere, where the live list
-- runs 181 central to 131 everywhere else.
--
-- Prices and hours are indicative and should be confirmed before publishing.
-- Google Places fills in photos, ratings and real hours once the name matches.
--
-- Run in the Supabase SQL editor, after batches 1 and 2.

INSERT INTO venues (name, type, location, wetness, wetness_score, price, price_display, description, rating, featured)
VALUES

-- ── Competitive socialising: none of this existed in the list ───────────────
('Rowans Tenpin Bowl', '{sports,gaming,family}', 'north', 'dry', 5, 12, 'From £12',
 'Finsbury Park institution: bowling, karaoke and an arcade, all slightly sticky and completely brilliant. Cheap before 6pm.', 4.3, false),

('Queens Skate Dine Bowl', '{sports,gaming,family}', 'west', 'dry', 5, 14, 'From £14',
 'An ice rink, a bowling alley and a diner stacked in one Bayswater building. If one of them fails to entertain the group, the next one is upstairs.', 4.3, false),

('Electric Shuffle', '{gaming,games,social}', 'central', 'dry', 0, 12, 'From £12',
 'Shuffleboard reinvented with a screen at the end that keeps score and mocks you. London Bridge, and better than it sounds.', 4.5, false),

('Roxy Ball Room', '{gaming,games,nightlife}', 'central', 'dry', 0, 10, 'From £10',
 'Beer pong, shuffleboard, ping pong, pool and karaoke under one roof. The rainy-day equivalent of saying yes to everything.', 4.3, false),

('Puttshack', '{gaming,family,games}', 'central', 'dry', 0, 14, 'From £14',
 'Mini golf where the ball keeps score itself, so nobody can cheat and everybody tries. Bank and White City.', 4.4, false),

('Junkyard Golf Club', '{gaming,games,entertainment}', 'east', 'dry', 0, 13, 'From £13',
 'Crazy golf through scrap: a course built from bumper cars, bathtubs and a caravan, with cocktails at every hole.', 4.4, false),

('Whistle Punks Urban Axe Throwing', '{sports,activities,social}', 'south', 'dry', 5, 25, 'From £25',
 'Indoor axe throwing with actual instruction, which is more satisfying and considerably safer than it sounds. Vauxhall.', 4.8, false),

('Lucky Voice Karaoke', '{music,nightlife,social}', 'central', 'dry', 0, 20, 'From £20',
 'Private karaoke booths with a button that summons more drinks. No stage, no audience, no dignity required.', 4.4, false),

('Bloomsbury Lanes', '{sports,gaming,music}', 'central', 'dry', 0, 11, 'From £11',
 'A basement bowling alley under a Bloomsbury hotel, part alley and part late-night music venue. Retro without trying.', 4.2, false),

-- ── Swimming and baths: the list had none at all ───────────────────────────
('London Aquatics Centre', '{sports,family,architecture}', 'east', 'dry', 5, 6, 'From £6',
 'Swim in Zaha Hadid''s Olympic pool for the price of a local leisure centre. The roof alone is worth the trip to Stratford.', 4.6, false),

('Marshall Street Leisure Centre', '{sports,historic}', 'central', 'dry', 0, 6, 'From £6',
 'A restored 1930s pool in Soho, all marble and barrel-vaulted ceiling. Lengths in a listed building.', 4.5, false),

('Oasis Sports Centre', '{sports,family}', 'central', 'slightly', 25, 7, 'From £7',
 'There is an indoor pool as well as the famous heated outdoor one, so it works whatever the sky is doing. Covent Garden.', 4.2, false),

-- ── Children, beyond another museum ────────────────────────────────────────
('Clip ''n Climb Chelsea', '{sports,family,activities}', 'west', 'dry', 0, 15, 'From £15',
 'Climbing walls designed as challenges rather than sport, with auto-belays so nobody has to know what a belay is. No experience needed.', 4.6, false),

('Discover Children''s Story Centre', '{family,museums,activities}', 'east', 'dry', 5, 8, 'From £8',
 'A whole building for making up stories, aimed squarely at under-8s. Stratford, and the rare place designed for children rather than tolerating them.', 4.6, false),

-- ── Making something with your hands ───────────────────────────────────────
('Bread Ahead Bakery School', '{workshops,dining,activities}', 'central', 'dry', 5, 30, 'From £30',
 'Doughnut and bread classes in Borough Market where you take home everything you make. Two hours and you have learned an actual skill.', 4.8, false),

('Lady Dinah''s Cat Emporium', '{cafes,dining,quirky}', 'south', 'dry', 5, 12, 'From £12',
 'Britain''s first cat cafe, reopened in Greenwich after its regulars crowdfunded it back to life. Hour-long sessions, and the cats decide how it goes.', 4.5, false),

-- ── Comedy: four listings for the whole city ───────────────────────────────
('Backyard Comedy Club', '{comedy,nightlife}', 'east', 'dry', 5, 15, 'From £15',
 'Lee Hurst''s purpose-built room in Bethnal Green, so decent sightlines and no pillar in the way. Proper line-ups, east London prices.', 4.6, false),

-- ── Science, and a music hall ──────────────────────────────────────────────
('Peter Harrison Planetarium', '{science,family,entertainment}', 'south', 'dry', 0, 12, 'From £12',
 'The only planetarium in London, sunk into the hill at Greenwich. Forty minutes lying back looking at a sky that cannot be rained off.', 4.6, false),

('Wilton''s Music Hall', '{theatre,music,historic}', 'east', 'dry', 5, 15, 'From £15',
 'The oldest surviving grand music hall in the world, saved from collapse and deliberately left looking its age. Go for anything that is on.', 4.7, false),

-- ── Distillery tours. Adults only, and tagged so /kids excludes them ───────
('Beefeater Gin Distillery', '{historic,entertainment,drinks}', 'south', 'dry', 5, 20, 'From £20',
 'The last historic gin distillery still working in London, with a tour and a gin tasting at the end. Kennington, and 18+.', 4.5, false),

('Sipsmith Distillery', '{historic,entertainment,drinks}', 'west', 'dry', 5, 25, 'From £25',
 'The Chiswick distillery that restarted London gin-making after two centuries. Small tours, proper gin tasting, 18+.', 4.7, false);


-- ── Deliberately left out ──────────────────────────────────────────────────
-- Gambado Chelsea, Oxygen Freejumping and L'atelier des Chefs were on the
-- shortlist and dropped: I could not confirm they are all still trading at the
-- London sites I had in mind, and a guide that sends someone across London to a
-- closed door is worse than a shorter guide.
--
-- Lady Dinah's above is a case in point. It closed in Bethnal Green in June 2025
-- and reopened in Greenwich after a crowdfunder, so the obvious listing would
-- have had the wrong side of the river and the wrong price.
