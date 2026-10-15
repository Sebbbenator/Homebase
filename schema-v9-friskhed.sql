-- ============================================================
-- V9: Friskhedsmodel (intervaller) erstatter flag-systemet
-- Kør i Supabase SQL Editor
-- ============================================================

-- Interval i dage (null = "efter behov", ingen automatisk status)
alter table tasks add column if not exists interval_days integer
  check (interval_days is null or interval_days > 0);

-- Denormaliseret "sidst gjort" for hurtig friskhedsberegning
alter table tasks add column if not exists last_completed_at timestamptz;
alter table tasks add column if not exists last_completed_by uuid references auth.users(id) on delete set null;

-- Point gemmes på selve fuldførelsen, så point-ændringer ikke ændrer historik
alter table preset_completions add column if not exists points integer not null default 10;

-- Backfill: point fra opgavens nuværende point
update preset_completions pc
set points = t.points
from tasks t
where t.id = pc.task_id;

-- Backfill: sidste fuldførelse pr. opgave
update tasks t
set last_completed_at = latest.completed_at,
    last_completed_by = latest.completed_by
from (
  select distinct on (task_id) task_id, completed_at, completed_by
  from preset_completions
  order by task_id, completed_at desc
) latest
where latest.task_id = t.id;

-- Standard-interval for eksisterende opgaver (7 dage) – ret efterfølgende i appen
update tasks set interval_days = 7 where is_preset = true and interval_days is null;

-- Fortryd: medlemmer må slette fuldførelser i eget hjem
drop policy if exists "Home members can delete preset completions" on preset_completions;
create policy "Home members can delete preset completions"
  on preset_completions for delete
  using (home_id in (select home_id from home_members where user_id = auth.uid()));

create index if not exists idx_preset_completions_home_time on preset_completions(home_id, completed_at desc);

-- Valgfri oprydning når alt kører (flag-systemet og user_points bruges ikke længere):
-- alter table tasks drop column preset_status;
-- drop function if exists recalculate_home_points(uuid);
-- drop table if exists user_points;
