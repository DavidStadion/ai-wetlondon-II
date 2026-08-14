-- Duplicate venues, found 14 August 2026.
--
-- 341 venues contain roughly 27 rows that are the same place twice. It became
-- visible rather than theoretical when /collection/with-a-scoreboard shipped:
-- the page lists "The Crystal Maze LIVE" and "The Crystal Maze LIVE Experience
-- London" one after the other, and "Clays" directly above "Clays Canary Wharf".
--
-- Why it matters beyond looking sloppy: two venue pages for one venue is
-- near-duplicate content, and "Duplicate, Google chose a different canonical" is
-- one of the statuses in the Pages report we are waiting on. It is a plausible
-- part of why indexing stalled at 3.
--
-- Why now: almost nothing is indexed yet, so deleting these costs no established
-- search equity. The same deletions in three months would throw away indexed
-- URLs and need redirects the site has no mechanism for. This is the cheap
-- moment.
--
-- The pattern: low ids (23, 60, 63, 69, 70, 71, 105) are the originals. The
-- 1400s and 1600s are a later import that re-added venues already present, and
-- the later copy usually carries the affiliate link. So the row to keep is
-- normally the newer, linked one, and the exceptions are called out below.
--
-- Run section 1 as it stands. Sections 2 and 3 need a decision from David and
-- are deliberately left as comments.

-- ---------------------------------------------------------------------------
-- STEP 0. Look before deleting.
-- ---------------------------------------------------------------------------

-- The rows section 1 will remove, so you can eyeball them first.
SELECT id, name, price, affiliate_link
FROM public.venues
WHERE id IN (71, 1498, 1495, 23, 1680, 1679, 1684, 70, 1497, 60, 1490)
ORDER BY name;

-- user_reviews references venues by name, not id, so there is no foreign key to
-- break. But a review attached to a name being deleted would be orphaned.
-- Expect 0 rows. If not, move those reviews to the surviving name first.
SELECT venue_name, count(*)
FROM public.user_reviews
WHERE venue_name IN (
  'The Crystal Maze LIVE', 'Immersive Gamebox', 'Fairgame', 'Curzon Soho Cinema',
  'Frameless Immersive Art', 'Paradox Museum', 'Moco Museum', 'Outernet',
  'Swingers Crazy Golf', 'Flight Club', 'Clays'
)
GROUP BY venue_name;

-- ---------------------------------------------------------------------------
-- STEP 1. Unambiguous duplicates. Same venue, twice.
-- ---------------------------------------------------------------------------
--
--   DELETE id  name                        KEEPING
--   71         The Crystal Maze LIVE       1466 The Crystal Maze LIVE Experience London (linked)
--   1498       Immersive Gamebox           1456 Immersive Gamebox Southbank (linked)
--   1495       Fairgame                    1462 Fairgame Canary Wharf (linked, and the only London site)
--   23         Curzon Soho Cinema          1469 Curzon Soho (linked)
--   1680       Frameless Immersive Art     69   Frameless (linked)
--   1679       Paradox Museum              1436 Paradox Museum London (linked)
--   1684       Moco Museum                 1435 Moco Museum London (linked)
--   70         Outernet                    1516 Outernet London (neither linked; official name wins)
--   1497       Swingers Crazy Golf         63 Swingers West End + 1457 Swingers City (the two real sites)
--   60         Flight Club                 1458 Shoreditch + 1459 Bloomsbury (both linked)
--   1490       Clays                       105  Clays Canary Wharf (the generic row priced £35 vs £20)

DELETE FROM public.venues
WHERE id IN (71, 1498, 1495, 23, 1680, 1679, 1684, 70, 1497, 60, 1490);

-- Expect: DELETE 11, leaving 330 venues.
SELECT count(*) AS venues_remaining FROM public.venues;

-- ---------------------------------------------------------------------------
-- STEP 2. Multi-branch chains. Needs a decision, so nothing is deleted here.
-- ---------------------------------------------------------------------------
--
-- Each of these has a generic row alongside a named branch. The generic row may
-- genuinely be a different branch that is worth keeping under its real name,
-- which is why guessing would be worse than asking.
--
--   'All Star Lanes' (£28) vs 'All Star Lanes Stratford' (£15)
--       Brick Lane, Holborn, Stratford and White City all exist. If the generic
--       row is Brick Lane, rename it rather than delete it:
--       UPDATE public.venues SET name = 'All Star Lanes Brick Lane' WHERE name = 'All Star Lanes';
--
--   'Electric Cinema' (£22) vs 'Electric Cinema Notting Hill' (£25)
--       Notting Hill, White City and Shoreditch exist. Same choice.
--
--   'Everyman Cinema' (£15) vs 'Everyman Cinema King's Cross' (£16, linked)
--       Everyman has around ten London sites, so the generic row is the least
--       useful page on the site. Probably delete, possibly rename.

-- ---------------------------------------------------------------------------
-- STEP 3. The "angle" variants. A product decision, not a data error.
-- ---------------------------------------------------------------------------
--
-- Sixteen rows are the same venue entered a second time as a different way of
-- visiting it. Someone did this on purpose, so it is David's call:
--
--   Tate Modern (late)                     National Gallery (masterpieces)
--   Wellcome Collection (reading room)     Leadenhall Market (covered wander)
--   Liberty London (warm wander)           London Transport Museum (family day)
--   Somerset House (seasonal shows)        London Mithraeum (City hideout)
--   Sir John Soane's Museum (Late opening) Museum of Brands (nostalgia)
--   Whitechapel Gallery (free show)        Japan House (food + design)
--   Waterstones Piccadilly (big browse)    Royal Academy of Arts (winter exhibition)
--   Barbican Centre (cinema + wander)      Tate Britain Exhibition
--
-- The problem: each generates its own venue page, so /venue/tate-modern and
-- /venue/tate-modern-late compete with each other for the same query while
-- saying nearly the same thing. That is the exact shape of thin, duplicated
-- content.
--
-- The better home for these is a collection or a "good to know" line on the one
-- real venue page, since "Tate Modern, but on a Friday night" is an angle rather
-- than a place. Two of them are arguably real and separate:
-- 'Tate Britain Exhibition' (paid show vs the free collection) and
-- 'Royal Albert Hall Tour' (a distinct bookable product, already linked).
--
-- Nothing here is deleted. Decide the principle first, then one UPDATE or DELETE
-- per row.
