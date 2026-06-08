begin;

create table public.video_likes (
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (video_id, user_id)
);

create table public.video_view_dedupes (
  video_id uuid not null references public.videos(id) on delete cascade,
  viewer_hash text not null,
  first_counted_at timestamptz not null default now(),
  last_counted_at timestamptz not null default now(),
  counted_times integer not null default 1,
  primary key (video_id, viewer_hash),
  constraint video_view_dedupes_viewer_hash_check
    check (viewer_hash ~ '^[a-f0-9]{64}$'),
  constraint video_view_dedupes_counted_times_check
    check (counted_times > 0)
);

create index idx_video_likes_user_id_created_at
  on public.video_likes (user_id, created_at desc);

create index idx_video_view_dedupes_video_id_last_counted_at
  on public.video_view_dedupes (video_id, last_counted_at desc);

alter table public.videos
  add constraint videos_view_count_nonnegative check (view_count >= 0),
  add constraint videos_like_count_nonnegative check (like_count >= 0);

create or replace function private.sync_video_like_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update public.videos
    set like_count = like_count + 1
    where id = new.video_id
      and storage_provider = 'cos'
      and published_at is not null;

    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.videos
    set like_count = greatest(like_count - 1, 0)
    where id = old.video_id
      and storage_provider = 'cos'
      and published_at is not null;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists sync_video_like_count on public.video_likes;

create trigger sync_video_like_count
after insert or delete on public.video_likes
for each row
execute function private.sync_video_like_count();

create or replace function public.record_cos_video_view(
  target_video_id uuid,
  target_viewer_hash text
)
returns table (
  counted boolean,
  view_count bigint
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_video public.videos%rowtype;
  current_dedupe public.video_view_dedupes%rowtype;
  current_timestamp timestamptz := now();
  next_counted boolean := false;
  next_view_count bigint := 0;
  inserted_rows integer := 0;
begin
  if target_video_id is null
    or target_viewer_hash is null
    or target_viewer_hash !~ '^[a-f0-9]{64}$'
  then
    raise exception 'Invalid video view payload.' using errcode = '22023';
  end if;

  select *
  into current_video
  from public.videos
  where id = target_video_id
    and storage_provider = 'cos'
    and published_at is not null
  for update;

  if not found then
    return query select false, 0::bigint;
    return;
  end if;

  insert into public.video_view_dedupes (
    video_id,
    viewer_hash,
    first_counted_at,
    last_counted_at,
    counted_times
  )
  values (
    target_video_id,
    target_viewer_hash,
    current_timestamp,
    current_timestamp,
    1
  )
  on conflict do nothing;

  get diagnostics inserted_rows = row_count;

  if inserted_rows = 1 then
    update public.videos
    set view_count = view_count + 1
    where id = target_video_id
    returning public.videos.view_count into next_view_count;

    next_counted := true;
  else
    select *
    into current_dedupe
    from public.video_view_dedupes
    where video_id = target_video_id
      and viewer_hash = target_viewer_hash
    for update;

    if not found then
      return query select false, current_video.view_count;
      return;
    end if;

    if current_dedupe.last_counted_at <= current_timestamp - interval '30 minutes' then
      update public.video_view_dedupes
      set
        last_counted_at = current_timestamp,
        counted_times = counted_times + 1
      where video_id = target_video_id
        and viewer_hash = target_viewer_hash;

      update public.videos
      set view_count = view_count + 1
      where id = target_video_id
      returning public.videos.view_count into next_view_count;

      next_counted := true;
    else
      next_view_count := current_video.view_count;
    end if;
  end if;

  return query select next_counted, next_view_count;
end;
$$;

alter table public.video_likes enable row level security;
alter table public.video_view_dedupes enable row level security;

create policy "video_likes_select_own"
on public.video_likes
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "video_likes_insert_own_published_cos"
on public.video_likes
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and exists (
    select 1
    from public.videos
    where videos.id = video_likes.video_id
      and videos.storage_provider = 'cos'
      and videos.published_at is not null
  )
);

create policy "video_likes_delete_own"
on public.video_likes
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

revoke all on table public.video_likes from anon, authenticated;
revoke all on table public.video_view_dedupes from anon, authenticated;

grant select, insert, delete on table public.video_likes to authenticated;

grant select, insert, update, delete on table public.video_likes to service_role;
grant select, insert, update, delete on table public.video_view_dedupes to service_role;

revoke all on function private.sync_video_like_count() from public;
revoke all on function private.sync_video_like_count() from anon;
revoke all on function private.sync_video_like_count() from authenticated;

revoke all on function public.record_cos_video_view(uuid, text) from public;
revoke all on function public.record_cos_video_view(uuid, text) from anon;
revoke all on function public.record_cos_video_view(uuid, text) from authenticated;
grant execute on function public.record_cos_video_view(uuid, text) to service_role;

commit;
