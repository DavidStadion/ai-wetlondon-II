-- Rain alert club: subscriber storage.
--
-- Run this once in the Supabase SQL editor.
--
-- Security model: the anon key must NEVER be able to read this table, or the
-- whole mailing list would be public. RLS is on with no policies at all, which
-- denies anon everything. Every read and write happens in the API functions
-- using the service role key, which bypasses RLS and is server-only.

create table if not exists public.subscribers (
  id            bigserial primary key,
  email         text        not null,
  -- Random token used for both the confirm link and the unsubscribe link.
  token         text        not null unique,
  confirmed_at  timestamptz,
  unsubscribed_at timestamptz,
  -- Which page they signed up from, so we learn what converts.
  source        text,
  created_at    timestamptz not null default now()
);

-- One row per address. Case-insensitive so Dave@ and dave@ cannot both sign up.
create unique index if not exists subscribers_email_key
  on public.subscribers (lower(email));

create index if not exists subscribers_confirmed_idx
  on public.subscribers (confirmed_at)
  where unsubscribed_at is null;

alter table public.subscribers enable row level security;
-- Deliberately no policies. Anon and authenticated get nothing.

-- Idempotency for the daily send. The cron inserts today's date before
-- sending; a unique violation means an alert already went out today, so a
-- retried or double-fired cron cannot mail the list twice.
create table if not exists public.rain_alerts (
  sent_on     date        primary key,
  recipients  integer     not null default 0,
  summary     text,
  created_at  timestamptz not null default now()
);

alter table public.rain_alerts enable row level security;
