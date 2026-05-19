-- RelAI database schema (Supabase / Postgres)
--
-- How to apply:
--   Option 1 (fast, GUI): Supabase Dashboard → SQL Editor → New Query → paste this file → Run
--   Option 2 (CLI):       supabase db push   (requires SUPABASE_DATABASE_PASSWORD)
--
-- Safe to re-run: every statement uses `if not exists` or `or replace`.

-- ---------- Extensions ----------

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------- attendees ----------
-- Event roster. Pre-seeded with 30–50 fake profiles plus any real Telegram users.

create table if not exists public.attendees (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  role             text not null,
  company          text,
  bio              text,
  interests        text[] not null default '{}',
  goals            text,
  availability     jsonb not null default '[]'::jsonb,
  telegram_chat_id bigint unique,
  created_at       timestamptz not null default now()
);

create index if not exists attendees_telegram_chat_id_idx
  on public.attendees (telegram_chat_id);

-- ---------- agents ----------
-- One per real user, created after Telegram onboarding completes.

create table if not exists public.agents (
  id              uuid primary key default gen_random_uuid(),
  attendee_id     uuid not null references public.attendees(id) on delete cascade,
  persona         jsonb not null default '{}'::jsonb,
  networking_goal text,
  constraints     jsonb not null default '{}'::jsonb,
  status          text not null default 'idle'
    check (status in ('idle','scanning','contacting','negotiating','done','cancelled')),
  created_at      timestamptz not null default now()
);

create index if not exists agents_attendee_id_idx
  on public.agents (attendee_id);

-- ---------- matches ----------
-- A candidate produced by the matchmaking + simulation steps.

create table if not exists public.matches (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.agents(id)     on delete cascade,
  target_id     uuid not null references public.attendees(id)  on delete cascade,
  score         int  not null check (score between 0 and 100),
  reason        text,
  status        text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  proposed_time timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists matches_requester_id_idx
  on public.matches (requester_id, created_at desc);

-- ---------- conversations ----------
-- Simulated agent-to-agent dialogue (one per match).

create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid not null unique references public.matches(id) on delete cascade,
  messages_json jsonb not null default '[]'::jsonb,
  summary       text,
  created_at    timestamptz not null default now()
);

-- ---------- graph_events ----------
-- Audit log that drives the React Flow graph + activity feed.

create table if not exists public.graph_events (
  id             uuid primary key default gen_random_uuid(),
  requester_id   uuid not null references public.agents(id) on delete cascade,
  type           text not null
    check (type in ('scanning','contacting','negotiating','matched','rejected','scheduled')),
  source_node_id text not null,
  target_node_id text,
  status         text not null default 'start'
    check (status in ('start','end')),
  message        text,
  created_at     timestamptz not null default now()
);

create index if not exists graph_events_requester_id_idx
  on public.graph_events (requester_id, created_at desc);

-- ---------- Row-Level Security ----------
-- The secret key bypasses RLS automatically (server-side writes work without policies).
-- The publishable key is gated by RLS — dashboard reads need explicit SELECT policies.

alter table public.attendees      enable row level security;
alter table public.agents         enable row level security;
alter table public.matches        enable row level security;
alter table public.conversations  enable row level security;
alter table public.graph_events   enable row level security;

-- Idempotent policy creation
drop policy if exists "public read attendees"     on public.attendees;
drop policy if exists "public read agents"        on public.agents;
drop policy if exists "public read matches"       on public.matches;
drop policy if exists "public read conversations" on public.conversations;
drop policy if exists "public read graph_events"  on public.graph_events;

create policy "public read attendees"     on public.attendees     for select using (true);
create policy "public read agents"        on public.agents        for select using (true);
create policy "public read matches"       on public.matches       for select using (true);
create policy "public read conversations" on public.conversations for select using (true);
create policy "public read graph_events"  on public.graph_events  for select using (true);
