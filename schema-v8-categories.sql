-- ============================================================
-- V8: Task categories
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add category column to tasks
alter table tasks
  add column if not exists category text not null default 'other';
