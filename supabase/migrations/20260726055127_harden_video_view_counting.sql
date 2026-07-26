begin;

-- These indexes lead with retention timestamps so an operator or future scheduler can
-- delete old tracking rows without scanning the per-video lookup indexes.
create index if not exists idx_video_view_dedupes_last_counted_at_video
  on public.video_view_dedupes (last_counted_at, video_id, viewer_hash);

create index if not exists idx_video_view_daily_buckets_bucket_date_video
  on public.video_view_daily_buckets (bucket_date, video_id, bucket_hash);

comment on column public.video_view_daily_buckets.counted_viewers is
  'Legacy column name: number of accepted view events for this source bucket and UTC date.';

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
set search_path = ''
as $$
declare
  bucket_view_limit constant integer := 20;
  daily_video_view_limit constant bigint := 10000;
  current_bucket_count integer := 0;
  current_bucket_date date := (current_timestamp at time zone 'UTC')::date;
  current_daily_count bigint := 0;
  current_dedupe public.video_view_dedupes%rowtype;
  current_timestamp_value timestamptz := current_timestamp;
  current_video_count bigint := 0;
  inserted_dedupe boolean := false;
  inserted_rows integer := 0;
  next_view_count bigint := 0;
begin
  if target_video_id is null
    or target_viewer_hash is null
    or target_viewer_hash !~ '^[a-f0-9]{64}$'
    or target_bucket_hash is null
    or target_bucket_hash !~ '^[a-f0-9]{64}$'
  then
    raise exception 'Invalid video view payload.' using errcode = '22023';
  end if;

  -- Avoid allocating an advisory lock for arbitrary video ids. This read is repeated
  -- after the lock because publication state may change while this call is waiting.
  select videos.view_count
  into current_video_count
  from public.videos
  where videos.id = target_video_id
    and videos.storage_provider = 'cos'
    and videos.published_at is not null;

  if not found then
    return query select false, 0::bigint;
    return;
  end if;

  -- Serialize the daily aggregate check without blocking unrelated writes to videos.
  -- Hash collisions only serialize unrelated counters; they cannot weaken the limit.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('record_cos_video_view:' || target_video_id::text),
    current_bucket_date - date '2000-01-01'
  );

  select videos.view_count
  into current_video_count
  from public.videos
  where videos.id = target_video_id
    and videos.storage_provider = 'cos'
    and videos.published_at is not null;

  if not found then
    return query select false, 0::bigint;
    return;
  end if;

  select coalesce(sum(buckets.counted_viewers), 0)
  into current_daily_count
  from public.video_view_daily_buckets as buckets
  where buckets.video_id = target_video_id
    and buckets.bucket_date = current_bucket_date;

  if current_daily_count >= daily_video_view_limit then
    return query select false, current_video_count;
    return;
  end if;

  select buckets.counted_viewers
  into current_bucket_count
  from public.video_view_daily_buckets as buckets
  where buckets.video_id = target_video_id
    and buckets.bucket_date = current_bucket_date
    and buckets.bucket_hash = target_bucket_hash;

  current_bucket_count := coalesce(current_bucket_count, 0);

  if current_bucket_count >= bucket_view_limit then
    return query select false, current_video_count;
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
    current_timestamp_value,
    current_timestamp_value,
    1
  )
  on conflict do nothing;

  get diagnostics inserted_rows = row_count;
  inserted_dedupe := inserted_rows = 1;

  if not inserted_dedupe then
    select dedupes.*
    into current_dedupe
    from public.video_view_dedupes as dedupes
    where dedupes.video_id = target_video_id
      and dedupes.viewer_hash = target_viewer_hash
    for update;

    if not found then
      return query select false, current_video_count;
      return;
    end if;

    if current_dedupe.last_counted_at > current_timestamp_value - interval '30 minutes' then
      return query select false, current_video_count;
      return;
    end if;
  end if;

  -- The video row is locked only after every anti-abuse decision accepts the event.
  -- Any later exception rolls back this increment and all tracking mutations together.
  update public.videos as videos
  set view_count = videos.view_count + 1
  where videos.id = target_video_id
    and videos.storage_provider = 'cos'
    and videos.published_at is not null
  returning videos.view_count into next_view_count;

  if not found then
    if inserted_dedupe then
      delete from public.video_view_dedupes as dedupes
      where dedupes.video_id = target_video_id
        and dedupes.viewer_hash = target_viewer_hash;
    end if;

    return query select false, 0::bigint;
    return;
  end if;

  insert into public.video_view_daily_buckets as buckets (
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
    1,
    current_timestamp_value,
    current_timestamp_value
  )
  on conflict (video_id, bucket_date, bucket_hash) do update
  set
    counted_viewers = buckets.counted_viewers + 1,
    last_counted_at = excluded.last_counted_at
  where buckets.counted_viewers < bucket_view_limit;

  get diagnostics inserted_rows = row_count;

  if inserted_rows <> 1 then
    raise exception 'Video view bucket limit changed concurrently.' using errcode = '40001';
  end if;

  if not inserted_dedupe then
    update public.video_view_dedupes as dedupes
    set
      last_counted_at = current_timestamp_value,
      counted_times = dedupes.counted_times + 1
    where dedupes.video_id = target_video_id
      and dedupes.viewer_hash = target_viewer_hash;
  end if;

  return query select true, next_view_count;
end;
$$;

revoke all on function public.record_cos_video_view(uuid, text, text) from public;
revoke all on function public.record_cos_video_view(uuid, text, text) from anon;
revoke all on function public.record_cos_video_view(uuid, text, text) from authenticated;
grant execute on function public.record_cos_video_view(uuid, text, text) to service_role;

create or replace function public.cleanup_video_view_tracking(
  target_dedupe_before timestamptz,
  target_bucket_before date,
  target_batch_size integer default 1000
)
returns table (
  deleted_dedupes integer,
  deleted_daily_buckets integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deleted_bucket_count integer := 0;
  deleted_dedupe_count integer := 0;
  current_utc_date date := (current_timestamp at time zone 'UTC')::date;
begin
  if target_dedupe_before is null
    or target_dedupe_before > current_timestamp - interval '30 minutes'
  then
    raise exception 'Dedupe cutoff must preserve the active 30 minute window.'
      using errcode = '22023';
  end if;

  if target_bucket_before is null or target_bucket_before > current_utc_date then
    raise exception 'Bucket cutoff must not delete the current UTC date.'
      using errcode = '22023';
  end if;

  if target_batch_size is null or target_batch_size < 1 or target_batch_size > 10000 then
    raise exception 'Cleanup batch size must be between 1 and 10000.'
      using errcode = '22023';
  end if;

  with candidates as materialized (
    select dedupes.video_id, dedupes.viewer_hash
    from public.video_view_dedupes as dedupes
    where dedupes.last_counted_at < target_dedupe_before
    order by dedupes.last_counted_at, dedupes.video_id, dedupes.viewer_hash
    limit target_batch_size
    for update skip locked
  ), deleted as (
    delete from public.video_view_dedupes as dedupes
    using candidates
    where dedupes.video_id = candidates.video_id
      and dedupes.viewer_hash = candidates.viewer_hash
    returning 1
  )
  select count(*)::integer
  into deleted_dedupe_count
  from deleted;

  with candidates as materialized (
    select buckets.video_id, buckets.bucket_date, buckets.bucket_hash
    from public.video_view_daily_buckets as buckets
    where buckets.bucket_date < target_bucket_before
    order by buckets.bucket_date, buckets.video_id, buckets.bucket_hash
    limit target_batch_size
    for update skip locked
  ), deleted as (
    delete from public.video_view_daily_buckets as buckets
    using candidates
    where buckets.video_id = candidates.video_id
      and buckets.bucket_date = candidates.bucket_date
      and buckets.bucket_hash = candidates.bucket_hash
    returning 1
  )
  select count(*)::integer
  into deleted_bucket_count
  from deleted;

  return query select deleted_dedupe_count, deleted_bucket_count;
end;
$$;

revoke all on function public.cleanup_video_view_tracking(timestamptz, date, integer)
  from public;
revoke all on function public.cleanup_video_view_tracking(timestamptz, date, integer)
  from anon;
revoke all on function public.cleanup_video_view_tracking(timestamptz, date, integer)
  from authenticated;
grant execute on function public.cleanup_video_view_tracking(timestamptz, date, integer)
  to service_role;

-- Keep retention automatic while leaving cron metadata under PostgreSQL's
-- administrative role. Supabase exposes pg_cron through the cron schema.
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
grant execute on function public.cleanup_video_view_tracking(timestamptz, date, integer)
  to postgres;

-- Reapplying this migration in a repaired environment must not duplicate the job.
-- cron.unschedule is used instead of mutating cron.job directly.
do $$
declare
  existing_job_id bigint;
begin
  for existing_job_id in
    select jobs.jobid
    from cron.job as jobs
    where jobs.jobname = 'cleanup-video-view-tracking-daily'
  loop
    perform cron.unschedule(existing_job_id);
  end loop;

  perform cron.schedule(
    'cleanup-video-view-tracking-daily',
    '17 4 * * *',
    $command$
      select public.cleanup_video_view_tracking(
        current_timestamp - interval '1 day',
        (current_timestamp at time zone 'UTC')::date - 30,
        10000
      );
    $command$
  );
end;
$$;

commit;
