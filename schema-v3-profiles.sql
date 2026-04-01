-- ============================================================
-- V3: Profiles table for emoji avatars + display names
-- Run this in Supabase SQL Editor
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_emoji text not null default '😀',
  updated_at timestamptz not null default now()
);

create index idx_profiles_id on profiles(id);

alter table profiles enable row level security;

create policy "Users can read all profiles"
  on profiles for select
  using (true);

create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, display_name, avatar_emoji)
  values (new.id, split_part(new.email, '@', 1), '😀');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill: create profiles for existing users
insert into profiles (id, display_name, avatar_emoji)
select id, split_part(email, '@', 1), '😀'
from auth.users
where id not in (select id from profiles)
on conflict (id) do nothing;
