begin;

-- The seven fixed palette tones predate tone families. The original backfill
-- treated unknown colors as neutral, so repair those deterministic mappings.
with expected_tone_families(color_hex, family_key) as (
  values
    ('#EF4444', 'red'),
    ('#F97316', 'orange'),
    ('#EAB308', 'yellow'),
    ('#22C55E', 'green'),
    ('#06B6D4', 'cyan'),
    ('#3B82F6', 'blue'),
    ('#8B5CF6', 'purple')
)
update public.tones as tone
set family_id = family.id
from expected_tone_families as expected
join public.tone_families as family
  on family.key = expected.family_key
where upper(tone.color_hex) = expected.color_hex
  and tone.family_id is distinct from family.id;

do $tone_mapping_audit$
begin
  if exists (
    select 1
    from public.tones as tone
    join (
      values
        ('#EF4444', 'red'),
        ('#F97316', 'orange'),
        ('#EAB308', 'yellow'),
        ('#22C55E', 'green'),
        ('#06B6D4', 'cyan'),
        ('#3B82F6', 'blue'),
        ('#8B5CF6', 'purple')
    ) as expected(color_hex, family_key)
      on upper(tone.color_hex) = expected.color_hex
    left join public.tone_families as family
      on family.key = expected.family_key
    where family.id is null
      or tone.family_id is distinct from family.id
  ) then
    raise exception 'Unable to repair the fixed tone family mappings.'
      using errcode = '23514';
  end if;
end;
$tone_mapping_audit$;

-- Invalid external ids cannot be repaired safely. Stop before replacing the
-- permissive constraint and report the required cleanup instead of guessing.
do $external_submission_audit$
declare
  invalid_identity_count bigint;
begin
  select count(*)
  into invalid_identity_count
  from public.submissions
  where storage_provider in ('bilibili', 'youtube')
    and (
      platform is distinct from storage_provider
      or external_id is null
      or (
        storage_provider = 'bilibili'
        and external_id !~ '^BV[0-9A-Za-z]{10}$'
      )
      or (
        storage_provider = 'youtube'
        and external_id !~ '^[0-9A-Za-z_-]{11}$'
      )
    );

  if invalid_identity_count > 0 then
    raise exception 'Found % external submissions with invalid platform or external_id values.',
      invalid_identity_count
      using errcode = '23514';
  end if;
end;
$external_submission_audit$;

-- A valid external id is sufficient to repair a stale or non-canonical URL.
update public.submissions
set source_url = case storage_provider
  when 'bilibili' then 'https://www.bilibili.com/video/' || external_id
  when 'youtube' then 'https://www.youtube.com/watch?v=' || external_id
end
where storage_provider in ('bilibili', 'youtube')
  and source_url is distinct from case storage_provider
    when 'bilibili' then 'https://www.bilibili.com/video/' || external_id
    when 'youtube' then 'https://www.youtube.com/watch?v=' || external_id
  end;

alter table public.submissions
  drop constraint if exists submissions_external_id_format_check,
  drop constraint if exists submissions_external_source_check;

alter table public.submissions
  add constraint submissions_external_id_format_check
    check (
      storage_provider not in ('bilibili', 'youtube')
      or (
        platform = storage_provider
        and external_id is not null
        and (
          (storage_provider = 'bilibili' and external_id ~ '^BV[0-9A-Za-z]{10}$')
          or
          (storage_provider = 'youtube' and external_id ~ '^[0-9A-Za-z_-]{11}$')
        )
      )
    ) not valid,
  add constraint submissions_external_source_check
    check (
      storage_provider not in ('bilibili', 'youtube')
      or (
        source_url is not null
        and source_url = case storage_provider
          when 'bilibili' then 'https://www.bilibili.com/video/' || external_id
          when 'youtube' then 'https://www.youtube.com/watch?v=' || external_id
        end
      )
    ) not valid;

alter table public.submissions
  validate constraint submissions_external_id_format_check;

alter table public.submissions
  validate constraint submissions_external_source_check;

-- Keep the denormalized videos.like_count cache independent of publication
-- state. video_likes remains the behavioral fact source for COS videos.
create or replace function private.sync_video_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.videos
    set like_count = like_count + 1
    where id = new.video_id
      and storage_provider = 'cos';

    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.videos
    set like_count = greatest(like_count - 1, 0)
    where id = old.video_id
      and storage_provider = 'cos';

    return old;
  end if;

  return null;
end;
$$;

revoke all on function private.sync_video_like_count() from public;
revoke all on function private.sync_video_like_count() from anon;
revoke all on function private.sync_video_like_count() from authenticated;
revoke all on function private.sync_video_like_count() from service_role;

drop trigger if exists sync_video_like_count on public.video_likes;

create trigger sync_video_like_count
after insert or delete on public.video_likes
for each row
execute function private.sync_video_like_count();

-- CREATE TRIGGER holds writes to video_likes until commit. Lock videos as well
-- so the one-time reconciliation cannot race another counter update.
lock table public.videos in share row exclusive mode;

with canonical_like_counts as (
  select
    video.id,
    count(video_like.user_id)::bigint as like_count
  from public.videos as video
  left join public.video_likes as video_like
    on video_like.video_id = video.id
  where video.storage_provider = 'cos'
  group by video.id
)
update public.videos as video
set like_count = canonical.like_count
from canonical_like_counts as canonical
where video.id = canonical.id
  and video.like_count is distinct from canonical.like_count;

do $like_count_audit$
begin
  if exists (
    select 1
    from public.videos as video
    where video.storage_provider = 'cos'
      and video.like_count is distinct from (
        select count(*)::bigint
        from public.video_likes as video_like
        where video_like.video_id = video.id
      )
  ) then
    raise exception 'Unable to reconcile COS video like counts.'
      using errcode = '23514';
  end if;
end;
$like_count_audit$;

-- Keep the mutation and counter read in one Data API transaction so callers
-- never have to infer whether a successful write preceded a failed refresh.
create or replace function public.set_cos_video_like(
  p_video_id uuid,
  p_liked boolean
)
returns table (
  liked boolean,
  like_count bigint
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_liked boolean;
  v_like_count bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_video_id is null or p_liked is null then
    raise exception 'Video id and liked state are required.' using errcode = '22023';
  end if;

  perform 1
  from public.videos as video
  where video.id = p_video_id
    and video.storage_provider = 'cos'
    and video.published_at is not null;

  if not found then
    raise exception 'Published COS video not found.' using errcode = 'P0002';
  end if;

  if p_liked then
    insert into public.video_likes (video_id, user_id)
    values (p_video_id, v_user_id)
    on conflict (video_id, user_id) do nothing;
  else
    delete from public.video_likes
    where video_id = p_video_id
      and user_id = v_user_id;
  end if;

  select
    exists (
      select 1
      from public.video_likes as video_like
      where video_like.video_id = p_video_id
        and video_like.user_id = v_user_id
    ),
    video.like_count
  into v_liked, v_like_count
  from public.videos as video
  where video.id = p_video_id
    and video.storage_provider = 'cos'
    and video.published_at is not null;

  if not found then
    raise exception 'Published COS video not found.' using errcode = 'P0002';
  end if;

  return query select v_liked, v_like_count;
end;
$$;

revoke all on function public.set_cos_video_like(uuid, boolean)
from public, anon, authenticated, service_role;

grant execute on function public.set_cos_video_like(uuid, boolean)
to authenticated;

-- Mirror the reviewed production implementation while keeping caller RLS and
-- grants effective through SECURITY INVOKER.
create or replace function public.approve_submission(
  p_submission_id uuid,
  p_category_id uuid,
  p_tag_ids uuid[] default array[]::uuid[],
  p_tone_ids uuid[] default array[]::uuid[],
  p_review_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_reviewer_id uuid := auth.uid();
  v_is_admin boolean := false;
  v_submission public.submissions%rowtype;
  v_meta jsonb;
  v_video_id uuid;
  v_tag_ids uuid[] := array[]::uuid[];
  v_tone_ids uuid[] := array[]::uuid[];
  v_platform text;
  v_embed_url text;
  v_source_published_epoch numeric;
  v_source_published_at timestamptz;
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

  if p_category_id is null then
    raise exception 'Category is required.' using errcode = '22023';
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

  if cardinality(v_tone_ids) > 3 then
    raise exception 'Select at most 3 tones.' using errcode = '22023';
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

  if v_submission.platform not in ('bilibili', 'youtube')
    or v_submission.storage_provider not in ('bilibili', 'youtube')
    or v_submission.platform <> v_submission.storage_provider
  then
    raise exception 'Unsupported submission source.' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(v_submission.external_id, '')), '') is null then
    raise exception 'External video id is required.' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(v_submission.source_url, '')), '') is null then
    raise exception 'Source url is required.' using errcode = '22023';
  end if;

  if v_submission.fetched_at is null then
    raise exception 'Fetch metadata before approving.' using errcode = '22023';
  end if;

  if v_submission.fetch_error is not null then
    raise exception 'Resolve metadata fetch error before approving.' using errcode = '22023';
  end if;

  v_meta := v_submission.auto_fetched_meta;

  if v_meta is null
    or jsonb_typeof(v_meta) is distinct from 'object'
    or jsonb_typeof(v_meta -> 'title') is distinct from 'string'
    or nullif(v_meta ->> 'title', '') is null
    or jsonb_typeof(v_meta -> 'pic') is distinct from 'string'
    or jsonb_typeof(v_meta -> 'desc') is distinct from 'string'
    or jsonb_typeof(v_meta -> 'ownerName') is distinct from 'string'
    or nullif(v_meta ->> 'ownerName', '') is null
    or jsonb_typeof(v_meta -> 'ownerAvatar') is distinct from 'string'
    or jsonb_typeof(v_meta -> 'viewCount') is distinct from 'number'
    or jsonb_typeof(v_meta -> 'likeCount') is distinct from 'number'
    or jsonb_typeof(v_meta -> 'duration') is distinct from 'number'
    or jsonb_typeof(v_meta -> 'pubdate') is distinct from 'number'
  then
    raise exception 'Cached metadata is incomplete.' using errcode = '22023';
  end if;

  v_source_published_epoch := (v_meta ->> 'pubdate')::numeric;

  if v_source_published_epoch <= 0 or v_source_published_epoch > 253402300799 then
    raise exception 'Cached metadata has an invalid publish date.' using errcode = '22023';
  end if;

  v_source_published_at := to_timestamp(v_source_published_epoch::double precision);
  v_platform := v_submission.platform;

  if v_platform = 'youtube' then
    v_embed_url := 'https://www.youtube-nocookie.com/embed/' || v_submission.external_id;
  else
    v_embed_url := 'https://player.bilibili.com/player.html?bvid=' || v_submission.external_id || '&page=1';
  end if;

  insert into public.videos (
    submission_id,
    platform,
    storage_provider,
    source_url,
    embed_url,
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
    v_submission.id,
    v_platform,
    v_platform,
    v_submission.source_url,
    v_embed_url,
    v_meta ->> 'title',
    v_meta ->> 'pic',
    v_meta ->> 'desc',
    v_meta ->> 'ownerName',
    v_meta ->> 'ownerAvatar',
    (v_meta ->> 'viewCount')::bigint,
    (v_meta ->> 'likeCount')::bigint,
    p_category_id,
    v_submission.user_id,
    v_source_published_at
  )
  returning id into v_video_id;

  insert into public.video_tags (video_id, tag_id)
  select v_video_id, tag_id
  from unnest(v_tag_ids) as selected(tag_id);

  insert into public.video_tones (video_id, tone_id)
  select v_video_id, tone_id
  from unnest(v_tone_ids) as selected(tone_id);

  update public.submissions
  set
    status = 'approved',
    reviewed_by = v_reviewer_id,
    reviewed_at = now(),
    review_note = nullif(trim(coalesce(p_review_note, '')), '')
  where id = v_submission.id;

  return v_video_id;
end;
$$;

revoke all on function public.approve_submission(uuid, uuid, uuid[], uuid[], text)
from public, anon, authenticated, service_role;

grant execute on function public.approve_submission(uuid, uuid, uuid[], uuid[], text)
to authenticated, service_role;

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.tones enable row level security;
alter table public.videos enable row level security;
alter table public.video_tags enable row level security;
alter table public.video_tones enable row level security;

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all"
on public.categories
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
);

drop policy if exists "tags_admin_all" on public.tags;
create policy "tags_admin_all"
on public.tags
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
);

drop policy if exists "tones_admin_all" on public.tones;
create policy "tones_admin_all"
on public.tones
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
);

drop policy if exists "videos_admin_all" on public.videos;
create policy "videos_admin_all"
on public.videos
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
);

drop policy if exists "video_tags_admin_all" on public.video_tags;
create policy "video_tags_admin_all"
on public.video_tags
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
);

drop policy if exists "video_tones_admin_all" on public.video_tones;
create policy "video_tones_admin_all"
on public.video_tones
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
);

revoke all privileges on table
  public.categories,
  public.tags,
  public.tones,
  public.videos,
  public.video_tags,
  public.video_tones
from public, anon, authenticated, service_role;

grant select on table
  public.categories,
  public.tags,
  public.tones,
  public.videos,
  public.video_tags,
  public.video_tones
to anon;

grant select, insert, update, delete on table
  public.categories,
  public.tags,
  public.tones,
  public.videos,
  public.video_tags,
  public.video_tones
to authenticated;

grant all privileges on table
  public.categories,
  public.tags,
  public.tones,
  public.videos,
  public.video_tags,
  public.video_tones
to service_role;

commit;
