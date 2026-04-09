-- ============================================================
-- V6: Add helper tracking to preset completions
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add helper_id column (nullable — helper is optional)
alter table preset_completions
  add column if not exists helper_id uuid references auth.users(id);

-- Index for querying by helper
create index if not exists idx_preset_completions_helper on preset_completions(helper_id);
