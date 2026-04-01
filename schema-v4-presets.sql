-- v4: Preset tasks — permanent tasks with completion history

-- Add preset columns to tasks
alter table tasks add column is_preset boolean not null default false;
alter table tasks add column preset_status text not null default 'idle'
  check (preset_status in ('idle', 'needs_doing'));

-- Completion history for preset tasks
create table preset_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  home_id uuid not null references homes(id) on delete cascade,
  completed_by uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now()
);

create index idx_preset_completions_task on preset_completions(task_id);

-- RLS
alter table preset_completions enable row level security;

create policy "Home members can view preset completions"
  on preset_completions for select
  using (home_id in (select home_id from home_members where user_id = auth.uid()));

create policy "Home members can insert preset completions"
  on preset_completions for insert
  with check (home_id in (select home_id from home_members where user_id = auth.uid()));

-- Enable realtime for preset_completions
alter publication supabase_realtime add table preset_completions;
