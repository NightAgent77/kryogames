-- Enable Realtime so signed-in clients get friend request / accept popups.
-- Run once in the Supabase SQL editor if friends.sql was applied before this existed.

alter table public.friendships replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'friendships'
  ) then
    alter publication supabase_realtime add table public.friendships;
  end if;
end $$;
