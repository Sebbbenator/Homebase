-- v5: Push notification subscriptions

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  home_id uuid not null references homes(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique(endpoint)
);

create index idx_push_subs_home on push_subscriptions(home_id);

alter table push_subscriptions enable row level security;

create policy "Users can manage own subscriptions"
  on push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Can read home member subscriptions"
  on push_subscriptions for select
  using (home_id in (select home_id from home_members where user_id = auth.uid()));
