-- Backfill searchable profiles + Auth display names for existing users.
-- Run in Supabase SQL Editor after friends.sql.
-- Friend search reads public.profiles — usernames only (never email).

-- 1) Upsert profiles from username metadata only (skip users with no username yet)
insert into public.profiles (id, username, avatar, updated_at)
select
  u.id,
  left(trim(u.raw_user_meta_data->>'username'), 24),
  nullif(u.raw_user_meta_data->>'avatar', ''),
  now()
from auth.users u
where nullif(trim(u.raw_user_meta_data->>'username'), '') is not null
  and position('@' in trim(u.raw_user_meta_data->>'username')) = 0
on conflict (id) do update
  set username = excluded.username,
      avatar = coalesce(excluded.avatar, public.profiles.avatar),
      updated_at = now();

-- 2) Fill Auth "Display name" from username only (not email)
update auth.users u
set raw_user_meta_data =
  coalesce(u.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'full_name', trim(u.raw_user_meta_data->>'username'),
    'name', trim(u.raw_user_meta_data->>'username')
  )
where nullif(trim(u.raw_user_meta_data->>'username'), '') is not null
  and position('@' in trim(u.raw_user_meta_data->>'username')) = 0;
