-- ============================================================
-- FIX: RPC functions for creating/joining homes
-- Run this in Supabase SQL Editor
-- ============================================================

-- Creates a home and adds the current user as a member (atomic)
create or replace function create_home_with_member(home_name text)
returns json
language plpgsql
security definer
as $$
declare
  new_home homes%rowtype;
begin
  insert into homes (name) values (home_name) returning * into new_home;
  insert into home_members (home_id, user_id) values (new_home.id, auth.uid());
  insert into user_points (home_id, user_id, points) values (new_home.id, auth.uid(), 0);
  return row_to_json(new_home);
end;
$$;

-- Joins a home by invite code
create or replace function join_home_by_code(code text)
returns json
language plpgsql
security definer
as $$
declare
  found_home homes%rowtype;
  existing_membership uuid;
begin
  -- Find the home
  select * into found_home from homes where invite_code = trim(code);
  if found_home.id is null then
    raise exception 'Home not found. Check the invite code.';
  end if;

  -- Check not already a member
  select id into existing_membership from home_members
    where home_id = found_home.id and user_id = auth.uid();
  if existing_membership is not null then
    raise exception 'You are already a member of this home.';
  end if;

  -- Add member
  insert into home_members (home_id, user_id) values (found_home.id, auth.uid());
  insert into user_points (home_id, user_id, points) values (found_home.id, auth.uid(), 0);
  return row_to_json(found_home);
end;
$$;
