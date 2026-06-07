begin;

alter table public.submissions
  add column if not exists storage_provider text,
  add column if not exists source_ref text,
  add column if not exists cover_ref text,
  add column if not exists pending_title text,
  add column if not exists pending_description text,
  add column if not exists file_size bigint,
  add column if not exists mime_type text,
  add column if not exists source_etag text,
  add column if not exists cover_etag text;

update public.submissions
set storage_provider = platform
where storage_provider is null;

alter table public.submissions
  alter column storage_provider set default 'bilibili',
  alter column storage_provider set not null,
  alter column source_url drop not null;

alter table public.submissions
  drop constraint if exists submissions_platform_check,
  add constraint submissions_platform_check
    check (platform in ('bilibili', 'cos')),
  add constraint submissions_storage_provider_check
    check (storage_provider in ('bilibili', 'cos')),
  add constraint submissions_bilibili_source_check
    check (
      storage_provider <> 'bilibili'
      or (platform = 'bilibili' and source_url is not null and external_id is not null)
    ),
  add constraint submissions_cos_source_check
    check (
      storage_provider <> 'cos'
      or (
        platform = 'cos'
        and source_ref is not null
        and cover_ref is not null
        and pending_title is not null
        and char_length(trim(pending_title)) between 1 and 80
        and (pending_description is null or char_length(pending_description) <= 500)
        and file_size is not null
        and file_size > 0
        and file_size <= 52428800
        and mime_type in ('video/mp4', 'video/webm')
        and source_etag is not null
        and cover_etag is not null
      )
    );

create unique index if not exists idx_submissions_storage_provider_source_ref_unique
  on public.submissions (storage_provider, source_ref)
  where source_ref is not null;

create index if not exists idx_submissions_storage_provider_status_created_at
  on public.submissions (storage_provider, status, created_at desc);

revoke update on table public.profiles from authenticated;
grant update (username) on table public.profiles to authenticated;

revoke insert on table public.submissions from authenticated;
grant insert (
  user_id,
  platform,
  storage_provider,
  source_url,
  external_id,
  status
) on table public.submissions to authenticated;

drop policy if exists "submissions_insert_own" on public.submissions;

create policy "submissions_insert_own"
on public.submissions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and platform = 'bilibili'
  and storage_provider = 'bilibili'
  and status = 'pending'
  and source_url is not null
  and external_id is not null
  and source_ref is null
  and cover_ref is null
  and pending_title is null
  and pending_description is null
  and file_size is null
  and mime_type is null
  and source_etag is null
  and cover_etag is null
  and auto_fetched_meta = '{}'::jsonb
  and reviewed_by is null
  and review_note is null
  and reviewed_at is null
);

grant select, insert on table public.submissions to service_role;

create or replace function private.enforce_native_submission_pending_limit()
returns trigger
language plpgsql
set search_path = pg_temp
as $$
declare
  pending_count integer;
begin
  if new.storage_provider <> 'cos' or new.status <> 'pending' then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('native_submission_pending_limit'),
    pg_catalog.hashtext(new.user_id::text)
  );

  select count(*)
  into pending_count
  from public.submissions
  where user_id = new.user_id
    and storage_provider = 'cos'
    and status = 'pending'
    and id <> new.id;

  if pending_count >= 3 then
    raise exception using
      errcode = '23514',
      message = format('user %s cannot have more than 3 pending native submissions', new.user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_native_submission_pending_limit on public.submissions;

create trigger enforce_native_submission_pending_limit
before insert or update of user_id, storage_provider, status on public.submissions
for each row
execute function private.enforce_native_submission_pending_limit();

drop policy if exists "submissions_admin_select_all" on public.submissions;
drop policy if exists "submissions_admin_update_all" on public.submissions;

create policy "submissions_admin_select_all"
on public.submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_admin
  )
);

create policy "submissions_admin_update_all"
on public.submissions
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_admin
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_admin
  )
);

grant update on table public.submissions to authenticated;

alter table public.videos
  add column if not exists storage_provider text,
  add column if not exists playback_ref text;

update public.videos
set storage_provider = platform
where storage_provider is null;

alter table public.videos
  alter column storage_provider set default 'bilibili',
  alter column storage_provider set not null,
  alter column source_url drop not null,
  alter column embed_url drop not null;

alter table public.videos
  drop constraint if exists videos_platform_check,
  add constraint videos_platform_check
    check (platform in ('bilibili', 'cos')),
  add constraint videos_storage_provider_check
    check (storage_provider in ('bilibili', 'cos')),
  add constraint videos_bilibili_source_check
    check (
      storage_provider <> 'bilibili'
      or (platform = 'bilibili' and source_url is not null and embed_url is not null)
    ),
  add constraint videos_cos_playback_check
    check (
      storage_provider <> 'cos'
      or (platform = 'cos' and playback_ref is not null)
    );

create unique index if not exists idx_videos_storage_provider_playback_ref_unique
  on public.videos (storage_provider, playback_ref)
  where playback_ref is not null;

create index if not exists idx_videos_storage_provider_published_at
  on public.videos (storage_provider, published_at desc);

commit;
