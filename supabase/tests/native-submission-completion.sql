-- Run on a development database; all fixture users, sessions and submissions roll back.
begin;

create temporary table native_completion_test_context on commit drop as
select gen_random_uuid() as user_id, mime
from unnest(array['video/mp4', 'video/webm', 'video/quicktime']) as formats(mime);
grant select on native_completion_test_context to service_role;

insert into auth.users (id, email, aud, role)
select user_id, 'native-completion-' || user_id::text || '@example.invalid',
  'authenticated', 'authenticated'
from native_completion_test_context;
insert into public.profiles (id, is_admin)
select user_id, true from native_completion_test_context
on conflict (id) do update set is_admin = true;

set local role service_role;

do $$
declare
  v_user_id uuid;
  v_session_id uuid;
  v_claim_token uuid;
  v_video_key text;
  v_cover_key text;
  v_feature boolean;
  v_mime text;
  v_video_id uuid;
  v_category_id uuid;
  v_result record;
begin
  select id into v_category_id from public.categories limit 1;
  if v_category_id is null then
    raise exception 'This regression requires a development category';
  end if;


  foreach v_mime in array array['video/mp4', 'video/webm', 'video/quicktime'] loop
  select user_id into v_user_id from native_completion_test_context where mime = v_mime;
  foreach v_feature in array array[false, true] loop
    v_session_id := gen_random_uuid();
    v_claim_token := gen_random_uuid();
    v_video_key := 'submissions/' || v_user_id || '/' || v_session_id || '/video.' || case v_mime when 'video/quicktime' then 'mov' when 'video/webm' then 'webm' else 'mp4' end;
    v_cover_key := 'submissions/' || v_user_id || '/' || v_session_id || '/cover.jpg';

    insert into public.native_upload_sessions (
      id, user_id, video_key, cover_key, status, expires_at
    ) values (
      v_session_id, v_user_id, v_video_key, v_cover_key, 'active', now() + interval '30 minutes'
    );

    select * into v_result from public.claim_native_submission_completion(
      v_session_id, v_user_id, v_video_key, v_cover_key, v_claim_token
    );
    if v_result.outcome is distinct from 'claimed' then
      raise exception 'Completion claim failed';
    end if;

    select * into v_result from public.finalize_native_submission_completion(
      v_session_id, v_user_id, v_claim_token, '投稿完成回归测试', null,
      1024::bigint, v_mime, 'test-video-etag', 'test-cover-etag', v_feature
    );
    if v_result.outcome is distinct from 'completed'
      or v_result.submission_id is distinct from v_session_id
      or v_result.feature_requested is distinct from v_feature then
      raise exception 'Completion result failed, feature requested: %', v_feature;
    end if;

    if not exists (
      select 1 from public.native_upload_sessions
      where id = v_session_id and status = 'completed' and submission_id = v_session_id
        and completion_claim_token is null and completion_lease_expires_at is null
    ) then
      raise exception 'Completion did not persist the session state';
    end if;

    -- A completed request must return the same submission on retry.
    select * into v_result from public.claim_native_submission_completion(
      v_session_id, v_user_id, v_video_key, v_cover_key, gen_random_uuid()
    );
    if v_result.outcome is distinct from 'completed'
      or v_result.submission_id is distinct from v_session_id then
      raise exception 'Completed claim retry failed';
    end if;

    -- Exercise ON CONFLICT with an existing submission and feature request.
    update public.native_upload_sessions
    set status = 'completing', submission_id = null,
      completion_claim_token = v_claim_token,
      completion_lease_expires_at = now() + interval '5 minutes'
    where id = v_session_id;
    select * into v_result from public.finalize_native_submission_completion(
      v_session_id, v_user_id, v_claim_token, '投稿完成回归测试', null,
      1024::bigint, v_mime, 'test-video-etag', 'test-cover-etag', v_feature
    );
    if v_result.outcome is distinct from 'completed'
      or v_result.submission_id is distinct from v_session_id
      or v_result.feature_requested is distinct from v_feature then
      raise exception 'Finalize retry failed';
    end if;

    -- Publish the completed upload as the fixture admin, without external storage.
    perform set_config('request.jwt.claim.sub', v_user_id::text, true);
    v_video_id := gen_random_uuid();
    perform public.approve_cos_submission(
      v_session_id, v_video_id, v_category_id,
      'videos/' || v_video_id || '/video.' || case v_mime when 'video/quicktime' then 'mov' when 'video/webm' then 'webm' else 'mp4' end,
      'https://example.invalid/cover.jpg'
    );
    if not exists (select 1 from public.videos where id = v_video_id and submission_id = v_session_id)
      or not exists (select 1 from public.submissions where id = v_session_id and status = 'approved' and mime_type = v_mime) then
      raise exception 'Publication failed for %', v_mime;
    end if;
  end loop;
  end loop;

  if (select count(*) from public.submissions where user_id in (select user_id from native_completion_test_context)) <> 6
    or (select count(*) from public.home_hero_feature_requests where created_by in (select user_id from native_completion_test_context)) <> 3 then
    raise exception 'Completion created duplicate submissions or feature requests';
  end if;
end;
$$;

rollback;
select 'native completion with/without home feature, session state and conflict idempotency passed; fixtures rolled back' as result;
