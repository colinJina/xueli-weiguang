begin;

alter table public.native_upload_sessions
  add column if not exists completion_claim_token uuid,
  add column if not exists completion_lease_expires_at timestamptz;

alter table public.native_upload_sessions
  drop constraint if exists native_upload_sessions_status_check,
  drop constraint if exists native_upload_sessions_submission_completed_check,
  drop constraint if exists native_upload_sessions_completion_state_check;

alter table public.native_upload_sessions
  add constraint native_upload_sessions_status_check
    check (status in ('active', 'completing', 'completed', 'expired')),
  add constraint native_upload_sessions_completion_state_check
    check (
      (
        status = 'completing'
        and submission_id is null
        and completion_claim_token is not null
        and completion_lease_expires_at is not null
      )
      or (
        status = 'completed'
        and submission_id is not null
        and completion_claim_token is null
        and completion_lease_expires_at is null
      )
      or (
        status in ('active', 'expired')
        and submission_id is null
        and completion_claim_token is null
        and completion_lease_expires_at is null
      )
    );

create index if not exists idx_native_upload_sessions_completing_lease
  on public.native_upload_sessions (completion_lease_expires_at)
  where status = 'completing';

create or replace function private.enforce_native_upload_session_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  open_count integer;
begin
  if new.status not in ('active', 'completing') then
    return new;
  end if;

  if new.status = 'active' and new.expires_at <= now() then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(new.user_id::text),
    pg_catalog.hashtext('native_upload_sessions_quota')
  );

  select count(*)
  into open_count
  from public.native_upload_sessions
  where user_id = new.user_id
    and (
      (status = 'active' and expires_at > now())
      or status = 'completing'
    )
    and id <> new.id;

  if open_count >= 3 then
    raise exception 'native_upload_session_limit_exceeded'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_native_upload_session_limit on public.native_upload_sessions;
create trigger enforce_native_upload_session_limit
before insert or update of user_id, status, expires_at, completion_lease_expires_at
on public.native_upload_sessions
for each row
execute function private.enforce_native_upload_session_limit();

create or replace function public.claim_native_submission_completion(
  p_session_id uuid,
  p_user_id uuid,
  p_video_key text,
  p_cover_key text,
  p_claim_token uuid
)
returns table (
  outcome text,
  lease_expires_at timestamptz,
  submission_id uuid,
  submission_status text,
  storage_provider text,
  source_ref text,
  source_etag text,
  cover_etag text,
  created_at timestamptz,
  feature_requested boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  session_row public.native_upload_sessions%rowtype;
  submission_row public.submissions%rowtype;
  next_lease_expires_at timestamptz;
begin
  if p_session_id is null
    or p_user_id is null
    or nullif(p_video_key, '') is null
    or nullif(p_cover_key, '') is null
    or p_claim_token is null
  then
    raise exception 'invalid_native_submission_completion_claim'
      using errcode = '22023';
  end if;

  select sessions.*
  into session_row
  from public.native_upload_sessions as sessions
  where sessions.id = p_session_id
    and sessions.user_id = p_user_id
  for update;

  if not found then
    return query
    select 'not_found'::text, null::timestamptz, null::uuid, null::text,
      null::text, null::text, null::text, null::text, null::timestamptz, false;
    return;
  end if;

  if session_row.status = 'completed' then
    select submissions.*
    into submission_row
    from public.submissions as submissions
    where submissions.id = session_row.submission_id
      and submissions.user_id = p_user_id
      and submissions.storage_provider = 'cos';

    if not found then
      raise exception 'completed_native_upload_session_missing_submission'
        using errcode = '23503';
    end if;

    return query
    select
      'completed'::text,
      null::timestamptz,
      submission_row.id,
      submission_row.status,
      submission_row.storage_provider,
      submission_row.source_ref,
      submission_row.source_etag,
      submission_row.cover_etag,
      submission_row.created_at,
      exists (
        select 1
        from public.home_hero_feature_requests as requests
        where requests.submission_id = submission_row.id
      );
    return;
  end if;

  if session_row.video_key <> p_video_key or session_row.cover_key <> p_cover_key then
    return query
    select 'invalid_keys'::text, null::timestamptz, null::uuid, null::text,
      null::text, null::text, null::text, null::text, null::timestamptz, false;
    return;
  end if;

  if session_row.status = 'expired' then
    return query
    select 'expired'::text, null::timestamptz, null::uuid, null::text,
      null::text, null::text, null::text, null::text, null::timestamptz, false;
    return;
  end if;

  if session_row.status = 'active' and session_row.expires_at <= now() then
    update public.native_upload_sessions
    set status = 'expired'
    where id = session_row.id;

    return query
    select 'expired'::text, null::timestamptz, null::uuid, null::text,
      null::text, null::text, null::text, null::text, null::timestamptz, false;
    return;
  end if;

  if session_row.status = 'completing'
    and session_row.completion_lease_expires_at > now()
    and session_row.completion_claim_token <> p_claim_token
  then
    return query
    select 'busy'::text, session_row.completion_lease_expires_at, null::uuid, null::text,
      null::text, null::text, null::text, null::text, null::timestamptz, false;
    return;
  end if;

  next_lease_expires_at := now() + interval '5 minutes';

  update public.native_upload_sessions
  set
    status = 'completing',
    completion_claim_token = p_claim_token,
    completion_lease_expires_at = next_lease_expires_at
  where id = session_row.id;

  return query
  select 'claimed'::text, next_lease_expires_at, null::uuid, null::text,
    null::text, null::text, null::text, null::text, null::timestamptz, false;
end;
$$;

create or replace function public.finalize_native_submission_completion(
  p_session_id uuid,
  p_user_id uuid,
  p_claim_token uuid,
  p_title text,
  p_description text,
  p_file_size bigint,
  p_mime_type text,
  p_source_etag text,
  p_cover_etag text,
  p_feature_on_home boolean default false
)
returns table (
  outcome text,
  lease_expires_at timestamptz,
  submission_id uuid,
  submission_status text,
  storage_provider text,
  source_ref text,
  source_etag text,
  cover_etag text,
  created_at timestamptz,
  feature_requested boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  session_row public.native_upload_sessions%rowtype;
  submission_row public.submissions%rowtype;
begin
  select sessions.*
  into session_row
  from public.native_upload_sessions as sessions
  where sessions.id = p_session_id
    and sessions.user_id = p_user_id
  for update;

  if not found then
    raise exception 'native_upload_session_not_found'
      using errcode = 'P0002';
  end if;

  if session_row.status = 'completed' then
    select submissions.*
    into submission_row
    from public.submissions as submissions
    where submissions.id = session_row.submission_id
      and submissions.user_id = p_user_id
      and submissions.storage_provider = 'cos';

    if not found then
      raise exception 'completed_native_upload_session_missing_submission'
        using errcode = '23503';
    end if;
  else
    if session_row.status <> 'completing'
      or session_row.completion_claim_token is distinct from p_claim_token
      or session_row.completion_lease_expires_at <= now()
    then
      raise exception 'native_submission_completion_claim_lost'
        using errcode = '40001';
    end if;

    if nullif(btrim(p_title), '') is null
      or char_length(btrim(p_title)) > 80
      or p_file_size is null
      or p_file_size <= 0
      or p_mime_type is null
      or p_mime_type not in ('video/mp4', 'video/webm')
      or char_length(btrim(coalesce(p_description, ''))) > 500
      or nullif(p_source_etag, '') is null
      or nullif(p_cover_etag, '') is null
    then
      raise exception 'invalid_native_submission_completion_payload'
        using errcode = '22023';
    end if;

    begin
      insert into public.submissions (
        id,
        user_id,
        platform,
        storage_provider,
        source_url,
        external_id,
        source_ref,
        cover_ref,
        source_etag,
        cover_etag,
        pending_title,
        pending_description,
        file_size,
        mime_type,
        status
      )
      values (
        session_row.id,
        p_user_id,
        'cos',
        'cos',
        null,
        session_row.video_key,
        session_row.video_key,
        session_row.cover_key,
        p_source_etag,
        p_cover_etag,
        btrim(p_title),
        nullif(btrim(coalesce(p_description, '')), ''),
        p_file_size,
        p_mime_type,
        'pending'
      )
      returning * into submission_row;
    exception
      when unique_violation then
        select submissions.*
        into submission_row
        from public.submissions as submissions
        where submissions.id = session_row.id
          and submissions.user_id = p_user_id
          and submissions.storage_provider = 'cos'
          and submissions.source_ref = session_row.video_key
          and submissions.cover_ref = session_row.cover_key;

        if not found then
          raise;
        end if;
    end;

    if coalesce(p_feature_on_home, false) then
      insert into public.home_hero_feature_requests (
        submission_id,
        created_by,
        status
      )
      values (
        submission_row.id,
        p_user_id,
        'pending'
      )
      on conflict (submission_id) do nothing;
    end if;

    update public.native_upload_sessions
    set
      status = 'completed',
      submission_id = submission_row.id,
      completion_claim_token = null,
      completion_lease_expires_at = null
    where id = session_row.id
      and status = 'completing'
      and completion_claim_token = p_claim_token;

    if not found then
      raise exception 'native_submission_completion_claim_lost'
        using errcode = '40001';
    end if;
  end if;

  return query
  select
    'completed'::text,
    null::timestamptz,
    submission_row.id,
    submission_row.status,
    submission_row.storage_provider,
    submission_row.source_ref,
    submission_row.source_etag,
    submission_row.cover_etag,
    submission_row.created_at,
    exists (
      select 1
      from public.home_hero_feature_requests as requests
      where requests.submission_id = submission_row.id
    );
end;
$$;

create or replace function public.resolve_native_submission_completion_failure(
  p_session_id uuid,
  p_user_id uuid,
  p_claim_token uuid,
  p_request_cleanup boolean default false
)
returns table (
  outcome text,
  cleanup_allowed boolean,
  video_key text,
  cover_key text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  session_row public.native_upload_sessions%rowtype;
  keys_are_referenced boolean;
begin
  select sessions.*
  into session_row
  from public.native_upload_sessions as sessions
  where sessions.id = p_session_id
    and sessions.user_id = p_user_id
  for update;

  if not found then
    return query select 'not_found'::text, false, null::text, null::text;
    return;
  end if;

  if session_row.status = 'completed' then
    return query
    select 'completed'::text, false, session_row.video_key, session_row.cover_key;
    return;
  end if;

  if session_row.status <> 'completing'
    or session_row.completion_claim_token is distinct from p_claim_token
    or session_row.completion_lease_expires_at <= now()
  then
    return query
    select 'claim_lost'::text, false, session_row.video_key, session_row.cover_key;
    return;
  end if;

  if not coalesce(p_request_cleanup, false) then
    update public.native_upload_sessions
    set
      status = 'active',
      expires_at = greatest(expires_at, now() + interval '5 minutes'),
      completion_claim_token = null,
      completion_lease_expires_at = null
    where id = session_row.id;

    return query
    select 'released'::text, false, session_row.video_key, session_row.cover_key;
    return;
  end if;

  select exists (
    select 1
    from public.submissions as submissions
    where submissions.source_ref in (session_row.video_key, session_row.cover_key)
      or submissions.cover_ref in (session_row.video_key, session_row.cover_key)
  )
  into keys_are_referenced;

  update public.native_upload_sessions
  set
    status = 'expired',
    completion_claim_token = null,
    completion_lease_expires_at = null
  where id = session_row.id;

  return query
  select
    'expired'::text,
    not keys_are_referenced,
    session_row.video_key,
    session_row.cover_key;
end;
$$;

revoke all on function public.claim_native_submission_completion(uuid, uuid, text, text, uuid)
  from public, anon, authenticated;
revoke all on function public.finalize_native_submission_completion(
  uuid, uuid, uuid, text, text, bigint, text, text, text, boolean
) from public, anon, authenticated;
revoke all on function public.resolve_native_submission_completion_failure(
  uuid, uuid, uuid, boolean
) from public, anon, authenticated;

grant execute on function public.claim_native_submission_completion(uuid, uuid, text, text, uuid)
  to service_role;
grant execute on function public.finalize_native_submission_completion(
  uuid, uuid, uuid, text, text, bigint, text, text, text, boolean
) to service_role;
grant execute on function public.resolve_native_submission_completion_failure(
  uuid, uuid, uuid, boolean
) to service_role;

commit;
