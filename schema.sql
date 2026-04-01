-- ============================================================
-- Household Management App — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Homes (households)
create table homes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default substring(gen_random_uuid()::text, 1, 8),
  created_at timestamptz not null default now()
);

-- Home memberships
create table home_members (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(home_id, user_id)
);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  due_date date,
  is_completed boolean not null default false,
  repeat_type text not null default 'none' check (repeat_type in ('none', 'daily', 'weekly')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Activity logs
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  task_id uuid references tasks(id) on delete set null,
  task_title text,
  created_at timestamptz not null default now()
);

-- Shopping items
create table shopping_items (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  name text not null,
  quantity text,
  added_by uuid not null references auth.users(id) on delete cascade,
  is_purchased boolean not null default false,
  created_at timestamptz not null default now()
);

-- User points (gamification)
create table user_points (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(home_id, user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_home_members_user_id on home_members(user_id);
create index idx_home_members_home_id on home_members(home_id);
create index idx_tasks_home_id on tasks(home_id);
create index idx_tasks_assigned_to on tasks(assigned_to);
create index idx_activity_logs_home_id on activity_logs(home_id);
create index idx_shopping_items_home_id on shopping_items(home_id);
create index idx_user_points_home_id on user_points(home_id);

-- ============================================================
-- HELPER FUNCTION: get current user's home_id
-- ============================================================

create or replace function get_user_home_id()
returns uuid
language sql
security definer
stable
as $$
  select home_id from home_members where user_id = auth.uid() limit 1;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table homes enable row level security;
alter table home_members enable row level security;
alter table tasks enable row level security;
alter table activity_logs enable row level security;
alter table shopping_items enable row level security;
alter table user_points enable row level security;

-- HOMES
create policy "Users can read their home"
  on homes for select
  using (id = get_user_home_id());

create policy "Users can insert a home"
  on homes for insert
  with check (true);

create policy "Members can update their home"
  on homes for update
  using (id = get_user_home_id());

-- HOME_MEMBERS
create policy "Users can read their home members"
  on home_members for select
  using (home_id = get_user_home_id());

create policy "Users can join a home"
  on home_members for insert
  with check (user_id = auth.uid());

-- TASKS
create policy "Members can read tasks"
  on tasks for select
  using (home_id = get_user_home_id());

create policy "Members can insert tasks"
  on tasks for insert
  with check (home_id = get_user_home_id() and created_by = auth.uid());

create policy "Members can update tasks"
  on tasks for update
  using (home_id = get_user_home_id());

create policy "Members can delete tasks"
  on tasks for delete
  using (home_id = get_user_home_id());

-- ACTIVITY_LOGS
create policy "Members can read activity"
  on activity_logs for select
  using (home_id = get_user_home_id());

create policy "Members can insert activity"
  on activity_logs for insert
  with check (home_id = get_user_home_id() and user_id = auth.uid());

-- SHOPPING_ITEMS
create policy "Members can read shopping"
  on shopping_items for select
  using (home_id = get_user_home_id());

create policy "Members can insert shopping"
  on shopping_items for insert
  with check (home_id = get_user_home_id() and added_by = auth.uid());

create policy "Members can update shopping"
  on shopping_items for update
  using (home_id = get_user_home_id());

create policy "Members can delete shopping"
  on shopping_items for delete
  using (home_id = get_user_home_id());

-- USER_POINTS
create policy "Members can read points"
  on user_points for select
  using (home_id = get_user_home_id());

create policy "Members can insert points"
  on user_points for insert
  with check (home_id = get_user_home_id());

create policy "Members can update points"
  on user_points for update
  using (home_id = get_user_home_id());

-- ============================================================
-- REALTIME
-- Enable realtime on tasks and shopping_items
-- ============================================================

alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table activity_logs;
