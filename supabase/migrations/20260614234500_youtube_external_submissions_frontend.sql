begin;

alter table public.submissions
  drop constraint if exists submissions_platform_check,
  drop constraint if exists submissions_storage_provider_check,
  drop constraint if exists submissions_bilibili_source_check,
  drop constraint if exists submissions_external_link_source_check,
  drop constraint if exists submissions_external_source_check,
  add constraint submissions_platform_check
    check (platform in ('bilibili', 'youtube', 'cos')),
  add constraint submissions_storage_provider_check
    check (storage_provider in ('bilibili', 'youtube', 'cos')),
  add constraint submissions_external_source_check
    check (
      storage_provider not in ('bilibili', 'youtube')
      or (
        platform = storage_provider
        and nullif(trim(coalesce(source_url, '')), '') is not null
        and external_id is not null
        and nullif(trim(external_id), '') is not null
      )
    );

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
  and platform in ('bilibili', 'youtube')
  and storage_provider = platform
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
  and fetched_at is null
  and fetch_error is null
  and reviewed_by is null
  and review_note is null
  and reviewed_at is null
);

create or replace function private.enforce_external_link_submission_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  pending_count integer;
  daily_count integer;
begin
  if new.storage_provider not in ('bilibili', 'youtube') or new.status <> 'pending' then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(new.user_id::text),
    pg_catalog.hashtext('external_link_submissions_quota')
  );

  select count(*)
  into pending_count
  from public.submissions
  where user_id = new.user_id
    and storage_provider in ('bilibili', 'youtube')
    and status = 'pending'
    and id <> new.id;

  if pending_count >= 20 then
    raise exception 'external_link_pending_submission_limit_exceeded'
      using errcode = '23514';
  end if;

  select count(*)
  into daily_count
  from public.submissions
  where user_id = new.user_id
    and storage_provider in ('bilibili', 'youtube')
    and created_at >= now() - interval '24 hours'
    and id <> new.id;

  if daily_count >= 50 then
    raise exception 'external_link_daily_submission_limit_exceeded'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_bilibili_submission_quota on public.submissions;
drop trigger if exists enforce_external_link_submission_quota on public.submissions;

create trigger enforce_external_link_submission_quota
before insert or update of user_id, storage_provider, status on public.submissions
for each row
execute function private.enforce_external_link_submission_quota();

drop function if exists private.enforce_bilibili_submission_quota();

alter table public.videos
  drop constraint if exists videos_platform_check,
  drop constraint if exists videos_storage_provider_check,
  drop constraint if exists videos_bilibili_source_check,
  drop constraint if exists videos_external_link_source_check,
  drop constraint if exists videos_external_source_check,
  add constraint videos_platform_check
    check (platform in ('bilibili', 'youtube', 'cos')),
  add constraint videos_storage_provider_check
    check (storage_provider in ('bilibili', 'youtube', 'cos')),
  add constraint videos_external_source_check
    check (
      storage_provider not in ('bilibili', 'youtube')
      or (
        platform = storage_provider
        and nullif(trim(coalesce(source_url, '')), '') is not null
        and nullif(trim(coalesce(embed_url, '')), '') is not null
      )
    );

commit;
