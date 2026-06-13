begin;

create table public.native_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_key text not null,
  cover_key text not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'expired')),
  expires_at timestamptz not null,
  submission_id uuid references public.submissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint native_upload_sessions_video_key_length
    check (char_length(video_key) between 1 and 2048),
  constraint native_upload_sessions_cover_key_length
    check (char_length(cover_key) between 1 and 2048),
  constraint native_upload_sessions_submission_completed_check
    check (status <> 'completed' or submission_id is not null)
);

create unique index idx_native_upload_sessions_video_key_unique
  on public.native_upload_sessions (video_key);

create unique index idx_native_upload_sessions_cover_key_unique
  on public.native_upload_sessions (cover_key);

create unique index idx_native_upload_sessions_submission_id_unique
  on public.native_upload_sessions (submission_id)
  where submission_id is not null;

create index idx_native_upload_sessions_user_status_expires_at
  on public.native_upload_sessions (user_id, status, expires_at desc);

drop trigger if exists set_native_upload_sessions_updated_at on public.native_upload_sessions;
create trigger set_native_upload_sessions_updated_at
before update on public.native_upload_sessions
for each row
execute function private.set_updated_at();

create or replace function private.enforce_native_upload_session_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  active_count integer;
begin
  if new.status <> 'active' or new.expires_at <= now() then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(new.user_id::text),
    pg_catalog.hashtext('native_upload_sessions_quota')
  );

  select count(*)
  into active_count
  from public.native_upload_sessions
  where user_id = new.user_id
    and status = 'active'
    and expires_at > now()
    and id <> new.id;

  if active_count >= 3 then
    raise exception 'native_upload_session_limit_exceeded'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_native_upload_session_limit on public.native_upload_sessions;
create trigger enforce_native_upload_session_limit
before insert or update of user_id, status, expires_at on public.native_upload_sessions
for each row
execute function private.enforce_native_upload_session_limit();

alter table public.native_upload_sessions enable row level security;

revoke all on table public.native_upload_sessions from anon, authenticated;
grant select, insert, update, delete on table public.native_upload_sessions to service_role;

commit;
