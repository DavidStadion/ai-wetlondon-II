-- Step 1 of the place_id work. Paste this into the Supabase SQL editor.
--
-- Check the project ref in the URL first: it must be iguspxisuudvvlcbtaxk
-- (wetlondon2026). The two other projects with more obvious names are paused.
--
-- Why this column exists
--
-- Every venue image currently costs a Places Text Search to work out which
-- place it is, and that lookup is the larger half of the bill: of £41.31 spent
-- 1 to 16 August, roughly £27 was lookups and £14.26 was serving the actual
-- photo bytes.
--
-- Google's terms allow caching a place ID indefinitely, unlike almost
-- everything else in a Places response, which is limited to about 30 days. So
-- this is the one field worth storing, and storing it means the paid lookup
-- happens once per venue ever instead of every time a CDN cache expires or a
-- deploy clears it.
--
-- After this, the photo path becomes an ID-only field mask, which Google bills
-- at nothing.

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS place_id text;

-- Expect 341 rows, all with place_id null.
SELECT count(*) AS venues, count(place_id) AS with_place_id
FROM public.venues;
