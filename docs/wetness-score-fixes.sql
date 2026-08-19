-- Wetness score fixes
-- Run by hand in the Supabase SQL editor. Check the project ref is
-- iguspxisuudvvlcbtaxk (wetlondon2026) first: the other two projects are paused
-- and are not the live site.
--
-- Nothing here runs itself and nothing is destructive above the line marked
-- DESTRUCTIVE. Read each block, run the SELECT, then decide.
--
-- Context. The bands the site shows are:
--     0-5%    Bone dry        door to door under cover
--     5-20%   Mostly dry      a minute or two in the open
--     20-35%  A bit damp      five or ten minutes exposed
--     35%+    Bring a brolly  a proper walk at one end of it


-- 1. Old Royal Naval College is scored 5%, "Bone dry", meaning door to door
--    under cover. Its own description says "Cutty Sark 5 min walk", and the
--    visit crosses open ground between the Painted Hall and the Chapel.
--
--    It is also the same place as "The Painted Hall" (id 120), which is scored
--    35%. Two records for one venue, 30 points apart, filed in different areas.

SELECT id, name, wetness_score, wetness, location, left(description, 80) AS blurb
FROM venues
WHERE id IN (1762, 120);

--    Suggested: keep 1762 (it has the better description) and give it a score
--    that matches the walk. 30% puts it in "A bit damp".

UPDATE venues SET wetness_score = 30, wetness = 'slightly'
WHERE id = 1762;                              -- Old Royal Naval College

--    Greenwich is filed as 'south' on the other record. Pick one and be
--    consistent, or leave it if 'east' is deliberate.
-- UPDATE venues SET location = 'south' WHERE id = 1762;


-- 2. The 138 venues scored exactly 0%.
--
--    0% claims you will not get wet at all, door to door under cover. That is
--    true of almost nothing in London, and this cohort includes the British
--    Museum, the National Gallery and the Shard, all of which involve a walk
--    from the station. It reads like a default that was never set rather than a
--    judgement that was made.
--
--    No automatic fix for this: I looked for a signal and there isn't a reliable
--    one. Only 24 of 341 descriptions state a walk time, and keyword guessing
--    flags things like "Leadenhall Market (covered wander)" that are already
--    correct. These need eyes.

SELECT id, name, location, left(description, 70) AS blurb
FROM venues
WHERE round(wetness_score) = 0
ORDER BY name;


-- 3. The legacy `wetness` column ('dry' / 'slightly' / 'wet').
--
--    It is set independently of wetness_score and disagrees with it on 123 of
--    341 rows. The site no longer shows any text derived from it, but two
--    filters still read it: the CustomizeModal preference filter
--    (venueSignals.ts) and nothing else after this change.
--
--    Either keep it in step with the score, or stop using it. This brings it
--    into step, which is the safe option and reversible:

-- UPDATE venues SET wetness = CASE
--   WHEN round(wetness_score) <= 5  THEN 'dry'
--   WHEN round(wetness_score) <= 35 THEN 'slightly'
--   ELSE 'wet'
-- END;


-- ---------------------------------------------------------------- DESTRUCTIVE
-- 4. Deleting the duplicate. Only after you have run the SELECT in block 1 and
--    are happy that 1762 is the record to keep.

-- DELETE FROM venues WHERE id = 120;          -- The Painted Hall, dup of 1762
