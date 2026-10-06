-- Run on a development database; all fixture users, sessions and submissions roll back.
begin;

create temporary table native_completion_test_context on commit drop as
select gen_random_uuid() as user_id;
grant select on native_completion_test_context to service_role;

insert into auth.users (id, email, aud, role)
select user_id, 'native-completion-' || user_id::text || '@example.invalid',
  'authenticated', 'authenticated'
from native_completion_test_context;
insert into public.profiles (id)
select user_id from native_completion_test_context
on conflict (id) do nothing;

set local role service_role;

do $$
declare
  v_user_id uuid;
  v_session_id uuid;
  v_claim_token uuid;
  v_video_key text;
  v_cover_key text;
  v_feature boolean;
  v_result record;
begin
  select user_id into v_user_id from native_completion_test_context;

  foreach v_feature in array array[false, true] loop
    v_session_id := gen_random_uuid();
    v_claim_token := gen_random_uuid();
    v_video_key := 'submissions/' || v_user_id || '/' || v_session_id || '/video.mp4';
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
      1024::bigint, 'video/mp4', 'test-video-etag', 'test-cover-etag', v_feature
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
      1024::bigint, 'video/mp4', 'test-video-etag', 'test-cover-etag', v_feature
    );
    if v_result.outcome is distinct from 'completed'
      or v_result.submission_id is distinct from v_session_id
      or v_result.feature_requested is distinct from v_feature then
      raise exception 'Finalize retry failed';
    end if;
  end loop;

  if (select count(*) from public.submissions where user_id = v_user_id) <> 2
    or (select count(*) from public.home_hero_feature_requests where created_by = v_user_id) <> 1 then
    raise exception 'Completion created duplicate submissions or feature requests';
  end if;
end;
$$;

rollback;
select 'native completion with/without home feature, session state and conflict idempotency passed; fixtures rolled back' as result;
