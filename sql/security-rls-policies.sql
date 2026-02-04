-- =====================================================
-- Wet London - Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- =====================================================
-- VENUES TABLE
-- =====================================================

-- Enable RLS on venues table
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read venues (public website needs this)
CREATE POLICY "Public can read venues"
ON venues
FOR SELECT
USING (true);

-- Only authenticated admin users can insert venues
CREATE POLICY "Authenticated users can insert venues"
ON venues
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated admin users can update venues
CREATE POLICY "Authenticated users can update venues"
ON venues
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Only authenticated admin users can delete venues
CREATE POLICY "Authenticated users can delete venues"
ON venues
FOR DELETE
USING (auth.role() = 'authenticated');


-- =====================================================
-- SMALL MIGHTY PARTNERS TABLE
-- =====================================================

-- Enable RLS on small_mighty_partners table
ALTER TABLE small_mighty_partners ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read partners (public website needs this)
CREATE POLICY "Public can read partners"
ON small_mighty_partners
FOR SELECT
USING (true);

-- Only authenticated admin users can insert partners
CREATE POLICY "Authenticated users can insert partners"
ON small_mighty_partners
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated admin users can update partners
CREATE POLICY "Authenticated users can update partners"
ON small_mighty_partners
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Only authenticated admin users can delete partners
CREATE POLICY "Authenticated users can delete partners"
ON small_mighty_partners
FOR DELETE
USING (auth.role() = 'authenticated');


-- =====================================================
-- EVENTS TABLE (if you have one)
-- =====================================================

-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read events
CREATE POLICY "Public can read events"
ON events
FOR SELECT
USING (true);

-- Only authenticated admin users can modify events
CREATE POLICY "Authenticated users can insert events"
ON events
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update events"
ON events
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete events"
ON events
FOR DELETE
USING (auth.role() = 'authenticated');


-- =====================================================
-- VERIFICATION QUERY
-- Run this after applying policies to verify they're active
-- =====================================================

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
