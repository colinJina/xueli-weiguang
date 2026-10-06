-- Accept native QuickTime uploads without changing ownership, size limits or completion leases.
begin;

alter table public.submissions
  drop constraint submissions_cos_source_check,
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
        and mime_type in ('video/mp4', 'video/webm', 'video/quicktime')
        and source_etag is not null
        and cover_etag is not null
      )
    );


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
      or p_mime_type not in ('video/mp4', 'video/webm', 'video/quicktime')
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

CREATE OR REPLACE FUNCTION public.approve_cos_submission(p_submission_id uuid, p_video_id uuid, p_category_id uuid, p_playback_ref text, p_cover_url text, p_tag_ids uuid[] DEFAULT ARRAY[]::uuid[], p_tone_ids uuid[] DEFAULT ARRAY[]::uuid[], p_review_note text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_reviewer_id uuid := auth.uid();
  v_is_admin boolean := false;
  v_submission public.submissions%rowtype;
  v_tag_ids uuid[] := array[]::uuid[];
  v_tone_ids uuid[] := array[]::uuid[];
  v_author_name text;
begin
  if v_reviewer_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select coalesce(p.is_admin, false)
  into v_is_admin
  from public.profiles p
  where p.id = v_reviewer_id;

  if not coalesce(v_is_admin, false) then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  if p_submission_id is null then
    raise exception 'Submission id is required.' using errcode = '22023';
  end if;

  if p_video_id is null then
    raise exception 'Video id is required.' using errcode = '22023';
  end if;

  if p_category_id is null then
    raise exception 'Category is required.' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(p_playback_ref, '')), '') is null then
    raise exception 'Playback ref is required.' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(p_cover_url, '')), '') is null then
    raise exception 'Cover url is required.' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct input_id), array[]::uuid[])
  into v_tag_ids
  from unnest(coalesce(p_tag_ids, array[]::uuid[])) as input(input_id)
  where input_id is not null;

  select coalesce(array_agg(distinct input_id), array[]::uuid[])
  into v_tone_ids
  from unnest(coalesce(p_tone_ids, array[]::uuid[])) as input(input_id)
  where input_id is not null;

  if cardinality(v_tag_ids) > 4 then
    raise exception 'Select at most 4 tags.' using errcode = '22023';
  end if;

  if cardinality(v_tone_ids) > 5 then
    raise exception 'Select at most 5 tones.' using errcode = '22023';
  end if;

  perform 1
  from public.categories
  where id = p_category_id;

  if not found then
    raise exception 'Category not found.' using errcode = '23503';
  end if;

  if exists (
    select 1
    from unnest(v_tag_ids) as selected(id)
    left join public.tags t on t.id = selected.id
    where t.id is null
  ) then
    raise exception 'Tag not found.' using errcode = '23503';
  end if;

  if exists (
    select 1
    from unnest(v_tone_ids) as selected(id)
    left join public.tones t on t.id = selected.id
    where t.id is null
  ) then
    raise exception 'Tone not found.' using errcode = '23503';
  end if;

  select *
  into v_submission
  from public.submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found.' using errcode = 'P0002';
  end if;

  if v_submission.status <> 'pending' then
    raise exception 'Only pending submissions can be approved.' using errcode = '22023';
  end if;

  if v_submission.storage_provider <> 'cos' or v_submission.platform <> 'cos' then
    raise exception 'Unsupported submission source.' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(v_submission.source_ref, '')), '') is null then
    raise exception 'COS source ref is required.' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(v_submission.cover_ref, '')), '') is null then
    raise exception 'COS cover ref is required.' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(v_submission.pending_title, '')), '') is null then
    raise exception 'COS pending title is required.' using errcode = '22023';
  end if;

  if v_submission.file_size is null or v_submission.file_size <= 0 then
    raise exception 'COS file size is required.' using errcode = '22023';
  end if;

  if v_submission.mime_type not in ('video/mp4', 'video/webm', 'video/quicktime') then
    raise exception 'Unsupported COS mime type.' using errcode = '22023';
  end if;

  select nullif(trim(p.username), '')
  into v_author_name
  from public.profiles p
  where p.id = v_submission.user_id;

  insert into public.videos (
    id,
    submission_id,
    platform,
    storage_provider,
    source_url,
    embed_url,
    playback_ref,
    title,
    cover_url,
    description,
    author_name,
    author_avatar,
    view_count,
    like_count,
    category_id,
    submitted_by,
    published_at
  )
  values (
    p_video_id,
    v_submission.id,
    'cos',
    'cos',
    null,
    null,
    p_playback_ref,
    trim(v_submission.pending_title),
    p_cover_url,
    nullif(trim(coalesce(v_submission.pending_description, '')), ''),
    coalesce(v_author_name, '原创投稿'),
    null,
    0,
    0,
    p_category_id,
    v_submission.user_id,
    now()
  );

  insert into public.video_tags (video_id, tag_id)
  select p_video_id, tag_id
  from unnest(v_tag_ids) as selected(tag_id);

  insert into public.video_tones (video_id, tone_id)
  select p_video_id, tone_id
  from unnest(v_tone_ids) as selected(tone_id);

  update public.submissions
  set
    status = 'approved',
    reviewed_by = v_reviewer_id,
    reviewed_at = now(),
    review_note = nullif(trim(coalesce(p_review_note, '')), '')
  where id = v_submission.id;

  return p_video_id;
end;
$function$
;

commit;
