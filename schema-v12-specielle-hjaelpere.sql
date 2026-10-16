-- ============================================================
-- V12: Flere hjælpere pr. fuldførelse + engangsopgaver ("Specielle")
-- Kør i Supabase SQL Editor
-- ============================================================

-- Flere hjælpere (produktionen på master brugte allerede helper_ids – "if not exists" gør den sikker)
alter table preset_completions add column if not exists helper_ids uuid[] not null default '{}';

update preset_completions
set helper_ids = array[helper_id]
where helper_id is not null and cardinality(helper_ids) = 0;

-- Engangsopgaver (is_preset = false): is_completed = klaret. Flaggede opgaver forbliver åbne.
alter table tasks alter column is_completed set default false;

update tasks
set is_completed = (last_completed_at is not null and preset_status <> 'needs_doing')
where is_preset = false;

create index if not exists idx_tasks_home_active on tasks(home_id, is_preset, is_completed);
