-- Tracks when a confirmation email last went to an address, so a repeat signup
-- cannot be used to bombard someone else's inbox from this domain. Enforced on
-- the row rather than per server instance, so it holds across restarts and
-- across however many instances Vercel is running.
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz;
