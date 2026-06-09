begin;

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

revoke all on function public.record_cos_video_view(uuid, text) from public;
revoke all on function public.record_cos_video_view(uuid, text) from anon;
revoke all on function public.record_cos_video_view(uuid, text) from authenticated;
grant execute on function public.record_cos_video_view(uuid, text) to service_role;

commit;
