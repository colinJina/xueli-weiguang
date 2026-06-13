begin;

create table public.video_view_daily_buckets (
  video_id uuid not null references public.videos(id) on delete cascade,
  bucket_date date not null,
  bucket_hash text not null,
  counted_viewers integer not null default 0,
  first_counted_at timestamptz not null default now(),
  last_counted_at timestamptz not null default now(),
  primary key (video_id, bucket_date, bucket_hash),
  constraint video_view_daily_buckets_hash_check
    check (bucket_hash ~ '^[a-f0-9]{64}$'),
  constraint video_view_daily_buckets_count_check
    check (counted_viewers >= 0 and counted_viewers <= 20)
);

create index idx_video_view_daily_buckets_video_date
  on public.video_view_daily_buckets (video_id, bucket_date desc);

alter table public.video_view_daily_buckets enable row level security;

revoke all on table public.video_view_daily_buckets from anon, authenticated;
grant select, insert, update, delete on table public.video_view_daily_buckets to service_role;

drop function if exists public.record_cos_video_view(uuid, text);

create or replace function public.record_cos_video_view(
  target_video_id uuid,
  target_viewer_hash text,
  target_bucket_hash text
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
  current_bucket public.video_view_daily_buckets%rowtype;
  current_timestamp timestamptz := now();
  current_bucket_date date := current_date;
  next_counted boolean := false;
  next_view_count bigint := 0;
  inserted_rows integer := 0;
begin
  if target_video_id is null
    or target_viewer_hash is null
    or target_viewer_hash !~ '^[a-f0-9]{64}$'
    or target_bucket_hash is null
    or target_bucket_hash !~ '^[a-f0-9]{64}$'
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
    insert into public.video_view_daily_buckets (
      video_id,
      bucket_date,
      bucket_hash,
      counted_viewers,
      first_counted_at,
      last_counted_at
    )
    values (
      target_video_id,
      current_bucket_date,
      target_bucket_hash,
      0,
      current_timestamp,
      current_timestamp
    )
    on conflict do nothing;

    select *
    into current_bucket
    from public.video_view_daily_buckets
    where video_id = target_video_id
      and bucket_date = current_bucket_date
      and bucket_hash = target_bucket_hash
    for update;

    if not found or current_bucket.counted_viewers >= 20 then
      delete from public.video_view_dedupes
      where video_id = target_video_id
        and viewer_hash = target_viewer_hash;

      return query select false, current_video.view_count;
      return;
    end if;

    update public.video_view_daily_buckets
    set
      counted_viewers = counted_viewers + 1,
      last_counted_at = current_timestamp
    where video_id = target_video_id
      and bucket_date = current_bucket_date
      and bucket_hash = target_bucket_hash;

    update public.videos as v
    set view_count = v.view_count + 1
    where v.id = target_video_id
    returning v.view_count into next_view_count;

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

      update public.videos as v
      set view_count = v.view_count + 1
      where v.id = target_video_id
      returning v.view_count into next_view_count;

      next_counted := true;
    else
      next_view_count := current_video.view_count;
    end if;
  end if;

  return query select next_counted, next_view_count;
end;
$$;

revoke all on function public.record_cos_video_view(uuid, text, text) from public;
revoke all on function public.record_cos_video_view(uuid, text, text) from anon;
revoke all on function public.record_cos_video_view(uuid, text, text) from authenticated;
grant execute on function public.record_cos_video_view(uuid, text, text) to service_role;

commit;
