-- ============================================================
-- V11: Indkøb 2.0 – butikssektioner og "ofte købt"-historik
-- Kør i Supabase SQL Editor
-- ============================================================

-- Sektion pr. vare (sættes automatisk ud fra navnet, kan rettes)
alter table shopping_items add column if not exists section text not null default 'other';

-- Historik over varer der er tilføjet før – bruges til "Ofte købt" og autocomplete
create table if not exists shopping_history (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  name text not null,
  name_key text not null,            -- lower(trim(name)) til opslag
  section text not null default 'other',
  last_quantity text,
  times integer not null default 1,
  last_used_at timestamptz not null default now(),
  unique (home_id, name_key)
);

create index if not exists idx_shopping_history_home on shopping_history(home_id, times desc);

alter table shopping_history enable row level security;

drop policy if exists "Members can read shopping history" on shopping_history;
create policy "Members can read shopping history"
  on shopping_history for select using (home_id = get_user_home_id());

drop policy if exists "Members can insert shopping history" on shopping_history;
create policy "Members can insert shopping history"
  on shopping_history for insert with check (home_id = get_user_home_id());

drop policy if exists "Members can update shopping history" on shopping_history;
create policy "Members can update shopping history"
  on shopping_history for update using (home_id = get_user_home_id());

drop policy if exists "Members can delete shopping history" on shopping_history;
create policy "Members can delete shopping history"
  on shopping_history for delete using (home_id = get_user_home_id());

-- Backfill historik fra eksisterende varer
insert into shopping_history (home_id, name, name_key, section, last_quantity, times, last_used_at)
select home_id, min(name), lower(trim(name)), 'other', max(quantity), count(*), max(created_at)
from shopping_items
group by home_id, lower(trim(name))
on conflict (home_id, name_key) do nothing;
