-- Wet London — 14 venues not currently listed (checked against the live table).
-- Three are 2026 openings; the rest are well-loved places you've simply not got yet.
--
-- Prices and hours are indicative and should be confirmed before publishing —
-- Google Places will fill in photos, ratings and hours automatically once the
-- name is right.
--
-- Run in the Supabase SQL editor.

INSERT INTO venues (name, type, location, wetness, wetness_score, price, price_display, description, rating, featured)
VALUES

-- ── New for 2026 ────────────────────────────────────────────────────────────
('V&A East Storehouse', '{museums,galleries}', 'east', 'dry', 0, 0, 'FREE',
 'Walk straight into the V&A''s working store — half a million objects on open shelves, no glass, no queue. Order anything out of storage to see up close.', 4.7, true),

('Museum of Illusions London', '{entertainment,museums}', 'central', 'dry', 0, 22, 'From £22',
 'Seventy-odd rooms and tricks that break your brain, including an upside-down phone box. Built for photos and reliably indoors.', 4.4, true),

('Wake The Tiger', '{entertainment,galleries}', 'west', 'dry', 0, 20, 'From £20',
 'An 80,000 sq ft ''amazement park'' at Westfield — psychedelic rooms you wander through rather than look at. Not a gallery, not a ride, somewhere in between.', 4.6, true),

-- ── Quiet, beautiful and criminally under-visited ────────────────────────────
('Barbican Conservatory', '{historic,galleries}', 'central', 'dry', 0, 0, 'FREE',
 'A jungle hidden inside the Barbican''s concrete — palms, ferns and koi under a glass roof. Open selected days, and one of the strangest rooms in London.', 4.6, false),

('Two Temple Place', '{historic,galleries}', 'central', 'dry', 0, 0, 'FREE',
 'An Astor mansion off the Embankment, opened to the public only for its winter exhibition. Stained glass, carved staircases, and almost nobody in it.', 4.7, false),

('Dennis Severs'' House', '{historic,museums}', 'east', 'dry', 5, 20, 'From £20',
 'A Spitalfields house frozen mid-18th-century, explored in silence by candlelight. Theatre more than museum — you leave slightly haunted.', 4.6, false),

('The Charterhouse', '{historic,museums}', 'central', 'dry', 10, 15, 'From £15',
 'Six centuries behind a gate most people walk past — monastery, Tudor mansion, almshouse, still lived in today.', 4.6, false),

('Handel Hendrix House', '{museums,music}', 'central', 'dry', 0, 14, 'From £14',
 'Two adjoining Mayfair flats: Handel wrote Messiah in one, Hendrix lived in the other 200 years later. Restored to both eras.', 4.6, false),

('Freud Museum London', '{museums,historic}', 'north', 'dry', 5, 14, 'From £14',
 'The Hampstead house Freud fled to in 1938, with the famous couch exactly where he left it.', 4.6, false),

('Foundling Museum', '{museums,galleries}', 'central', 'dry', 0, 14, 'From £14',
 'Britain''s first children''s charity, told through Hogarth paintings and the heartbreaking tokens mothers left with their babies.', 4.7, false),

('Garden Museum', '{museums,cafes}', 'south', 'slightly', 10, 14, 'From £14',
 'Inside a deconsecrated church by Lambeth Palace, with a very good café and a knot garden for when it brightens up.', 4.5, false),

('The Fan Museum', '{museums,historic}', 'south', 'dry', 5, 5, 'From £5',
 'Two Georgian houses in Greenwich holding 5,000 fans. Absurdly specific, genuinely lovely, and cheap.', 4.5, false),

('Eltham Palace', '{historic,museums}', 'south', 'slightly', 15, 17, 'From £17',
 'A medieval great hall bolted onto a jaw-dropping Art Deco house. Worth the trip south for the circular entrance hall alone.', 4.7, false),

('Horniman Museum', '{museums,family}', 'south', 'slightly', 20, 0, 'FREE',
 'Free museum of the world in Forest Hill — an overstuffed walrus, an aquarium, and a natural history gallery unchanged in a century.', 4.7, false);
