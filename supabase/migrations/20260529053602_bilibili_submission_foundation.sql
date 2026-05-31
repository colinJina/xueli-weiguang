begin;

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

create table public.tones (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform = 'bilibili'),
  source_url text not null,
  external_id text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  auto_fetched_meta jsonb not null default '{}'::jsonb,
  reviewed_by uuid references public.profiles(id),
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (platform, external_id)
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions(id) on delete cascade,
  platform text not null check (platform = 'bilibili'),
  source_url text not null,
  embed_url text not null,
  title text not null,
  cover_url text,
  description text,
  author_name text,
  author_avatar text,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  category_id uuid not null references public.categories(id),
  submitted_by uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.video_tags (
  video_id uuid not null references public.videos(id) on delete cascade,
  tag_id uuid not null references public.tags(id),
  primary key (video_id, tag_id)
);

create table public.video_tones (
  video_id uuid not null references public.videos(id) on delete cascade,
  tone_id uuid not null references public.tones(id),
  primary key (video_id, tone_id)
);

create index idx_videos_category_id on public.videos(category_id);
create index idx_videos_published_at on public.videos(published_at desc);
create index idx_video_tags_tag_id_video_id on public.video_tags(tag_id, video_id);
create index idx_video_tones_tone_id_video_id on public.video_tones(tone_id, video_id);
create index idx_submissions_status_created_at on public.submissions(status, created_at desc);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();

create or replace function private.enforce_video_tag_limit()
returns trigger
language plpgsql
as $$
declare
  tag_count integer;
begin
  if tg_op = 'UPDATE' and new.video_id = old.video_id then
    return new;
  end if;

  select count(*)
  into tag_count
  from public.video_tags
  where video_id = new.video_id;

  if tag_count >= 4 then
    raise exception using
      errcode = '23514',
      message = format('video %s cannot have more than 4 tags', new.video_id);
  end if;

  return new;
end;
$$;

create trigger enforce_video_tag_limit
before insert or update of video_id on public.video_tags
for each row
execute function private.enforce_video_tag_limit();

create or replace function private.enforce_video_tone_max()
returns trigger
language plpgsql
as $$
declare
  tone_count integer;
begin
  if tg_op = 'UPDATE' and new.video_id = old.video_id then
    return new;
  end if;

  select count(*)
  into tone_count
  from public.video_tones
  where video_id = new.video_id;

  if tone_count >= 3 then
    raise exception using
      errcode = '23514',
      message = format('video %s cannot have more than 3 tones', new.video_id);
  end if;

  return new;
end;
$$;

create trigger enforce_video_tone_max
before insert or update of video_id on public.video_tones
for each row
execute function private.enforce_video_tone_max();

create or replace function private.assert_video_has_exactly_three_tones(target_video_id uuid)
returns void
language plpgsql
as $$
declare
  tone_count integer;
begin
  if target_video_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.videos
    where id = target_video_id
  ) then
    return;
  end if;

  select count(*)
  into tone_count
  from public.video_tones
  where video_id = target_video_id;

  if tone_count <> 3 then
    raise exception using
      errcode = '23514',
      message = format('video %s must have exactly 3 tones, found %s', target_video_id, tone_count);
  end if;
end;
$$;

create or replace function private.enforce_video_tone_count_from_videos()
returns trigger
language plpgsql
as $$
begin
  perform private.assert_video_has_exactly_three_tones(new.id);
  return null;
end;
$$;

create or replace function private.enforce_video_tone_count_from_video_tones()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform private.assert_video_has_exactly_three_tones(old.video_id);
  else
    perform private.assert_video_has_exactly_three_tones(new.video_id);
    if tg_op = 'UPDATE' and new.video_id <> old.video_id then
      perform private.assert_video_has_exactly_three_tones(old.video_id);
    end if;
  end if;

  return null;
end;
$$;

create constraint trigger videos_require_exactly_three_tones
after insert or update on public.videos
deferrable initially deferred
for each row
execute function private.enforce_video_tone_count_from_videos();

create constraint trigger video_tones_require_exactly_three_tones
after insert or update or delete on public.video_tones
deferrable initially deferred
for each row
execute function private.enforce_video_tone_count_from_video_tones();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.tones enable row level security;
alter table public.submissions enable row level security;
alter table public.videos enable row level security;
alter table public.video_tags enable row level security;
alter table public.video_tones enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "categories_public_read"
on public.categories
for select
to anon, authenticated
using (true);

create policy "tags_public_read"
on public.tags
for select
to anon, authenticated
using (true);

create policy "tones_public_read"
on public.tones
for select
to anon, authenticated
using (true);

create policy "submissions_insert_own"
on public.submissions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "submissions_select_own"
on public.submissions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "videos_public_read_published"
on public.videos
for select
to anon, authenticated
using (published_at is not null);

create policy "video_tags_public_read_published_videos"
on public.video_tags
for select
to anon, authenticated
using (
  video_id in (
    select id
    from public.videos
    where published_at is not null
  )
);

create policy "video_tones_public_read_published_videos"
on public.video_tones
for select
to anon, authenticated
using (
  video_id in (
    select id
    from public.videos
    where published_at is not null
  )
);

grant usage on schema public to anon, authenticated;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.tags from anon, authenticated;
revoke all on table public.tones from anon, authenticated;
revoke all on table public.submissions from anon, authenticated;
revoke all on table public.videos from anon, authenticated;
revoke all on table public.video_tags from anon, authenticated;
revoke all on table public.video_tones from anon, authenticated;

grant select on table public.categories to anon, authenticated;
grant select on table public.tags to anon, authenticated;
grant select on table public.tones to anon, authenticated;
grant select on table public.videos to anon, authenticated;
grant select on table public.video_tags to anon, authenticated;
grant select on table public.video_tones to anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert on table public.submissions to authenticated;

commit;
