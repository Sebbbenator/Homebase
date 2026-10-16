-- ============================================================
-- V13: Fase 4 – rotation, præmier, reaktioner, opslagstavle, fravær, affaldskalender
-- Kør i Supabase SQL Editor
-- ============================================================

-- Rotation: skiftes til at gøre opgaven ("din tur")
alter table tasks add column if not exists rotation boolean not null default false;

-- Affaldskalender (ICS-feed fra kommunen)
alter table homes add column if not exists waste_ics_url text;

-- Nye notifikationstyper
alter table notification_prefs add column if not exists reactions boolean not null default true;
alter table notification_prefs add column if not exists waste boolean not null default true;

-- Præmier
create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  title text not null,
  emoji text not null default '🎁',
  cost integer not null check (cost > 0),
  created_by uuid not null references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists reward_claims (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  reward_id uuid references rewards(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  cost integer not null,
  created_at timestamptz not null default now()
);

-- Reaktioner på fuldførelser (👏)
create table if not exists completion_reactions (
  id uuid primary key default gen_random_uuid(),
  completion_id uuid not null references preset_completions(id) on delete cascade,
  home_id uuid not null references homes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null default '👏',
  created_at timestamptz not null default now(),
  unique (completion_id, user_id)
);

-- Opslagstavle
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  title text not null,
  body text,
  pinned boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fravær ("jeg er væk")
create table if not exists absences (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  note text,
  created_at timestamptz not null default now(),
  check (to_date >= from_date)
);

create index if not exists idx_rewards_home on rewards(home_id);
create index if not exists idx_reward_claims_home on reward_claims(home_id, created_at desc);
create index if not exists idx_reactions_completion on completion_reactions(completion_id);
create index if not exists idx_notes_home on notes(home_id, pinned desc, updated_at desc);
create index if not exists idx_absences_home on absences(home_id, to_date);

-- RLS: alle i hjemmet kan læse og skrive; egne rækker kan slettes af ejeren (præmier/noter af alle)
alter table rewards enable row level security;
alter table reward_claims enable row level security;
alter table completion_reactions enable row level security;
alter table notes enable row level security;
alter table absences enable row level security;

drop policy if exists "members rewards" on rewards;
create policy "members rewards" on rewards for all
  using (home_id = get_user_home_id()) with check (home_id = get_user_home_id());

drop policy if exists "members read claims" on reward_claims;
create policy "members read claims" on reward_claims for select using (home_id = get_user_home_id());
drop policy if exists "own claims" on reward_claims;
create policy "own claims" on reward_claims for insert with check (home_id = get_user_home_id() and user_id = auth.uid());

drop policy if exists "members read reactions" on completion_reactions;
create policy "members read reactions" on completion_reactions for select using (home_id = get_user_home_id());
drop policy if exists "own reactions" on completion_reactions;
create policy "own reactions" on completion_reactions for all
  using (user_id = auth.uid()) with check (home_id = get_user_home_id() and user_id = auth.uid());

drop policy if exists "members notes" on notes;
create policy "members notes" on notes for all
  using (home_id = get_user_home_id()) with check (home_id = get_user_home_id());

drop policy if exists "members read absences" on absences;
create policy "members read absences" on absences for select using (home_id = get_user_home_id());
drop policy if exists "own absences" on absences;
create policy "own absences" on absences for all
  using (user_id = auth.uid()) with check (home_id = get_user_home_id() and user_id = auth.uid());

-- Realtime på reaktioner, så 👏 dukker op hos de andre med det samme
alter publication supabase_realtime add table completion_reactions;
