-- Run once in Supabase SQL Editor if attendees already exists without constraints.
-- Safe to re-run.

alter table public.attendees
  add column if not exists constraints jsonb not null default '{}'::jsonb;

-- Refresh PostgREST schema cache (Supabase picks this up within seconds)
notify pgrst, 'reload schema';
