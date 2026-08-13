-- KryoGames play stats: distinct games played + daily play minutes
-- Run once in Supabase SQL Editor (Dashboard → SQL → New query)
-- Requires public.profiles from friends.sql

-- Distinct catalog games a user has launched at least once
create table if not exists public.played_games (
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null,
  first_played_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create index if not exists played_games_user_idx on public.played_games (user_id);
create index if not exists played_games_game_idx on public.played_games (game_id);

-- Minutes played per calendar day (UTC date key from client)
create table if not exists public.play_activity (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  minutes double precision not null default 0 check (minutes >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists play_activity_user_day_idx
  on public.play_activity (user_id, day desc);

drop trigger if exists play_activity_set_updated_at on public.play_activity;
create trigger play_activity_set_updated_at
  before update on public.play_activity
  for each row execute function public.set_updated_at();

-- Atomically add minutes for the signed-in user
create or replace function public.add_play_minutes(p_day date, p_minutes double precision)
returns double precision
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_minutes double precision;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_minutes is null or p_minutes <= 0 then
    select coalesce(minutes, 0) into new_minutes
    from public.play_activity
    where user_id = uid and day = p_day;
    return coalesce(new_minutes, 0);
  end if;

  insert into public.play_activity (user_id, day, minutes, updated_at)
  values (uid, p_day, p_minutes, now())
  on conflict (user_id, day) do update
    set minutes = public.play_activity.minutes + excluded.minutes,
        updated_at = now()
  returning minutes into new_minutes;

  return new_minutes;
end;
$$;

revoke all on function public.add_play_minutes(date, double precision) from public;
grant execute on function public.add_play_minutes(date, double precision) to authenticated;

-- RLS
alter table public.played_games enable row level security;
alter table public.play_activity enable row level security;

-- Readable by any signed-in user (public profiles / friends / leaderboards later)
drop policy if exists "played_games_select_authenticated" on public.played_games;
create policy "played_games_select_authenticated"
  on public.played_games for select
  to authenticated
  using (true);

drop policy if exists "played_games_insert_own" on public.played_games;
create policy "played_games_insert_own"
  on public.played_games for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "played_games_delete_own" on public.played_games;
create policy "played_games_delete_own"
  on public.played_games for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "play_activity_select_authenticated" on public.play_activity;
create policy "play_activity_select_authenticated"
  on public.play_activity for select
  to authenticated
  using (true);

drop policy if exists "play_activity_insert_own" on public.play_activity;
create policy "play_activity_insert_own"
  on public.play_activity for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "play_activity_update_own" on public.play_activity;
create policy "play_activity_update_own"
  on public.play_activity for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "play_activity_delete_own" on public.play_activity;
create policy "play_activity_delete_own"
  on public.play_activity for delete
  to authenticated
  using (auth.uid() = user_id);
