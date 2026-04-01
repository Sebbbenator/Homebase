-- ============================================================
-- V2: Add biweekly repeat type
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop the old check constraint and add new one with 'biweekly'
alter table tasks drop constraint tasks_repeat_type_check;
alter table tasks add constraint tasks_repeat_type_check
  check (repeat_type in ('none', 'daily', 'weekly', 'biweekly'));
