-- Disambiguate the feature request primary key from the submission_id RPC output.
begin;

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
      on conflict on constraint home_hero_feature_requests_pkey do nothing;
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

revoke all on function public.finalize_native_submission_completion(
  uuid, uuid, uuid, text, text, bigint, text, text, text, boolean
) from public, anon, authenticated;

grant execute on function public.finalize_native_submission_completion(
  uuid, uuid, uuid, text, text, bigint, text, text, text, boolean
) to service_role;

commit;
