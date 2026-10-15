-- ============================================================
-- V10: Notifikationer – præferencer, stille timer, cron-markører
-- Kør i Supabase SQL Editor
-- ============================================================

-- Præferencer pr. bruger (alt er slået til som standard)
create table if not exists notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  task_needed boolean not null default true,      -- en opgave trænger (rød)
  task_done boolean not null default true,        -- nogen tog en opgave
  helper_mention boolean not null default true,   -- du blev nævnt som hjælper
  rank_change boolean not null default true,      -- nogen overhalede dig
  shopping boolean not null default true,         -- nye varer / nogen handler
  morning_brief boolean not null default true,    -- kl. 08 hvis noget trænger
  evening_reminder boolean not null default true, -- kl. 19 hvis noget er >24 t over
  weekly_summary boolean not null default true,   -- søndag kl. 18
  streak_warning boolean not null default true,   -- søndag middag hvis stimen er i fare
  quiet_start text not null default '22:00',
  quiet_end text not null default '07:00',
  updated_at timestamptz not null default now()
);

alter table notification_prefs enable row level security;

drop policy if exists "Users manage own notification prefs" on notification_prefs;
create policy "Users manage own notification prefs"
  on notification_prefs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Markør: hvornår vi sidst sagde "denne opgave trænger" (nulstilles ved fuldførelse)
alter table tasks add column if not exists needed_notified_at timestamptz;

-- Markør: indkøbsvarer vi allerede har sendt besked om
alter table shopping_items add column if not exists notified_at timestamptz;

-- Rate-limit for "nogen er ved at handle"
alter table homes add column if not exists shopping_started_at timestamptz;
alter table homes add column if not exists shopping_started_by uuid references auth.users(id) on delete set null;

-- Hvilke planlagte jobs er kørt hvilken dag (pr. hjem) – gør cron-tick idempotent
create table if not exists cron_runs (
  home_id uuid not null references homes(id) on delete cascade,
  job text not null,
  run_date date not null,
  ran_at timestamptz not null default now(),
  primary key (home_id, job, run_date)
);

-- ============================================================
-- VALGFRIT: Kør cron-tick hvert 10. minut fra Supabase (pg_cron + pg_net)
-- Giver præcise tidspunkter uanset Vercel-plan. Erstat URL og nøgle.
-- ============================================================
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule(
--   'homebase-tick',
--   '*/10 * * * *',
--   $$ select net.http_get(
--        url := 'https://DIT-DOMÆNE.vercel.app/api/cron/tick?key=DIN_CRON_SECRET'
--      ); $$
-- );
