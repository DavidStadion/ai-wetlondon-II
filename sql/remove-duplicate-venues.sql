-- Wet London: remove duplicate venue rows.
--
-- 303 rows currently, 28 of them duplicates, leaving 275.
-- That matches the prerenderer, which emits 275 pages from 303 rows because it
-- deduplicates by URL slug before writing files.
--
-- For each pair the row kept is the one with more filled-in fields, and the
-- lower id where they tie. Deletions are listed by explicit id rather than
-- computed, so you can see exactly what goes before you run it.
--
-- NOTE: 'Sir John Soane's Museum' appears twice with different apostrophe
-- characters (id 114 straight, id 1476 curly). Name matching cannot see that,
-- but both produce the same URL, so one has to go. Kept 114, the higher rated.
-- Left alone: id 1521, 'Sir John Soane's Museum (Late opening)', which is a
-- genuinely different thing and gets its own URL.

-- ── STEP 1: review before deleting anything ────────────────────────────────
-- Run this first. It should return exactly 28 rows.
SELECT id, name, rating, price_display
FROM venues
WHERE id IN (1475, 1476, 1477, 1479, 1481, 1482, 1484, 1485, 1486, 1487, 1488, 1491, 1492, 1501, 1502, 1503, 1506, 1510, 1511, 1514, 1515, 1520, 1523, 1526, 1527, 1533, 1534, 1535)
ORDER BY name;

-- ── STEP 2: the deletions ──────────────────────────────────────────────────
-- Keeping / dropping, pair by pair:
--   BFI IMAX                                               keep    40  drop 1487
--   Barbican Centre                                        keep    33  drop 1502
--   Bounce Ping Pong                                       keep    26  drop 1492
--   British Library                                        keep    28  drop 1501
--   Cartoon Museum                                         keep   121  drop 1482
--   Curzon Soho                                            keep  1469  drop 1523
--   Design Museum                                          keep     8  drop 1481
--   Dulwich Picture Gallery                                keep  1439  drop 1526
--   Electric Cinema                                        keep    99  drop 1488
--   Flight Club                                            keep    60  drop 1491
--   Frameless Immersive Art                                keep  1680  drop 1515
--   Guildhall Art Gallery                                  keep   116  drop 1510
--   Imperial War Museum                                    keep     6  drop 1485
--   Leighton House                                         keep  1437  drop 1511
--   Liberty London                                         keep    53  drop 1506
--   London Dungeon                                         keep    31  drop 1535
--   London Mithraeum                                       keep   109  drop 1484
--   Madame Tussauds                                        keep    72  drop 1534
--   Mercato Mayfair                                        keep   107  drop 1520
--   Museum of Brands                                       keep   115  drop 1479
--   Museum of the Home                                     keep  1471  drop 1514
--   Prince Charles Cinema                                  keep    42  drop 1486
--   Queer Britain Museum                                   keep  1444  drop 1475
--   SEA LIFE London                                        keep    73  drop 1533
--   Somerset House                                         keep    97  drop 1503
--   The Courtauld Gallery                                  keep  1440  drop 1527
--   Wellcome Collection                                    keep    29  drop 1477
--   Sir John Soane's Museum (curly-apostrophe twin)        keep   114  drop 1476

DELETE FROM venues
WHERE id IN (1475, 1476, 1477, 1479, 1481, 1482, 1484, 1485, 1486, 1487, 1488, 1491, 1492, 1501, 1502, 1503, 1506, 1510, 1511, 1514, 1515, 1520, 1523, 1526, 1527, 1533, 1534, 1535);

-- ── STEP 3: confirm ────────────────────────────────────────────────────────
-- Expect a single row: 275, and no duplicate names left.
SELECT count(*) AS total FROM venues;
SELECT name, count(*) FROM venues GROUP BY name HAVING count(*) > 1;
