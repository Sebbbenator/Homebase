-- ============================================================
-- V7: Custom points per task + retroactive point recalculation
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add points column to tasks (default 10)
alter table tasks
  add column if not exists points integer not null default 10;

-- Function to recalculate all user points for a home
-- based on preset_completions × task points
create or replace function recalculate_home_points(target_home_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Delete existing points for this home
  delete from user_points where home_id = target_home_id;

  -- Recalculate from completions: each completion awards the task's current points
  -- Both the completer and the helper (if any) get points
  insert into user_points (home_id, user_id, points)
  select
    target_home_id,
    u.user_id,
    coalesce(sum(t.points), 0)
  from (
    -- Points for completers
    select pc.completed_by as user_id, pc.task_id
    from preset_completions pc
    where pc.home_id = target_home_id
    union all
    -- Points for helpers
    select pc.helper_id as user_id, pc.task_id
    from preset_completions pc
    where pc.home_id = target_home_id
      and pc.helper_id is not null
  ) u
  join tasks t on t.id = u.task_id
  group by u.user_id
  on conflict (home_id, user_id)
    do update set points = excluded.points, updated_at = now();
end;
$$;
