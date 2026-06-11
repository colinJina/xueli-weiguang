begin;

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists headline text,
  add column if not exists avatar_url text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  add constraint profiles_display_name_length
    check (display_name is null or char_length(trim(display_name)) between 1 and 80),
  add constraint profiles_headline_length
    check (headline is null or char_length(trim(headline)) <= 120),
  add constraint profiles_avatar_url_length
    check (avatar_url is null or char_length(trim(avatar_url)) <= 500);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  normalized_name text generated always as (lower(btrim(name))) stored,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint collections_description_length check (char_length(description) <= 500),
  constraint collections_user_normalized_name_unique unique (user_id, normalized_name)
);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  note text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collection_items_note_length check (char_length(note) <= 500),
  constraint collection_items_collection_video_unique unique (collection_id, video_id)
);

create table if not exists public.collection_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  normalized_name text generated always as (lower(btrim(name))) stored,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collection_tags_name_length check (char_length(btrim(name)) between 1 and 40),
  constraint collection_tags_user_normalized_name_unique unique (user_id, normalized_name)
);

create table if not exists public.collection_item_tags (
  collection_item_id uuid not null references public.collection_items(id) on delete cascade,
  tag_id uuid not null references public.collection_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (collection_item_id, tag_id)
);

create index if not exists idx_collections_user_sort
  on public.collections (user_id, sort_order, created_at desc);

create index if not exists idx_collection_items_collection_sort
  on public.collection_items (collection_id, sort_order, created_at desc);

create index if not exists idx_collection_items_video_id
  on public.collection_items (video_id);

create index if not exists idx_collection_tags_user_sort
  on public.collection_tags (user_id, sort_order, created_at desc);

create index if not exists idx_collection_item_tags_tag_item
  on public.collection_item_tags (tag_id, collection_item_id);

drop trigger if exists set_collections_updated_at on public.collections;
create trigger set_collections_updated_at
before update on public.collections
for each row
execute function private.set_updated_at();

drop trigger if exists set_collection_items_updated_at on public.collection_items;
create trigger set_collection_items_updated_at
before update on public.collection_items
for each row
execute function private.set_updated_at();

drop trigger if exists set_collection_tags_updated_at on public.collection_tags;
create trigger set_collection_tags_updated_at
before update on public.collection_tags
for each row
execute function private.set_updated_at();

create or replace function private.enforce_collection_item_tag_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  item_owner uuid;
  tag_owner uuid;
  tag_count integer;
begin
  select c.user_id
  into item_owner
  from public.collection_items ci
  join public.collections c on c.id = ci.collection_id
  where ci.id = new.collection_item_id;

  select ct.user_id
  into tag_owner
  from public.collection_tags ct
  where ct.id = new.tag_id;

  if item_owner is null or tag_owner is null or item_owner <> tag_owner then
    raise exception 'Collection item and tag must belong to the same user.'
      using errcode = '42501';
  end if;

  select count(*)
  into tag_count
  from public.collection_item_tags cit
  where cit.collection_item_id = new.collection_item_id;

  if tag_count >= 10 then
    raise exception 'A collection item can have at most 10 tags.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_collection_item_tag_rules on public.collection_item_tags;
create trigger enforce_collection_item_tag_rules
before insert on public.collection_item_tags
for each row
execute function private.enforce_collection_item_tag_rules();

alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.collection_tags enable row level security;
alter table public.collection_item_tags enable row level security;

drop policy if exists "collections_select_own" on public.collections;
create policy "collections_select_own"
on public.collections
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "collections_insert_own" on public.collections;
create policy "collections_insert_own"
on public.collections
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "collections_update_own" on public.collections;
create policy "collections_update_own"
on public.collections
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "collections_delete_own" on public.collections;
create policy "collections_delete_own"
on public.collections
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "collection_items_select_own" on public.collection_items;
create policy "collection_items_select_own"
on public.collection_items
for select
to authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = collection_items.collection_id
      and collections.user_id = (select auth.uid())
  )
);

drop policy if exists "collection_items_insert_own_published_video" on public.collection_items;
create policy "collection_items_insert_own_published_video"
on public.collection_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.collections
    where collections.id = collection_items.collection_id
      and collections.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.videos
    where videos.id = collection_items.video_id
      and videos.published_at is not null
  )
);

drop policy if exists "collection_items_update_own" on public.collection_items;
create policy "collection_items_update_own"
on public.collection_items
for update
to authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = collection_items.collection_id
      and collections.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.collections
    where collections.id = collection_items.collection_id
      and collections.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.videos
    where videos.id = collection_items.video_id
      and videos.published_at is not null
  )
);

drop policy if exists "collection_items_delete_own" on public.collection_items;
create policy "collection_items_delete_own"
on public.collection_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = collection_items.collection_id
      and collections.user_id = (select auth.uid())
  )
);

drop policy if exists "collection_tags_select_own" on public.collection_tags;
create policy "collection_tags_select_own"
on public.collection_tags
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "collection_tags_insert_own" on public.collection_tags;
create policy "collection_tags_insert_own"
on public.collection_tags
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "collection_tags_update_own" on public.collection_tags;
create policy "collection_tags_update_own"
on public.collection_tags
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "collection_tags_delete_own" on public.collection_tags;
create policy "collection_tags_delete_own"
on public.collection_tags
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "collection_item_tags_select_own" on public.collection_item_tags;
create policy "collection_item_tags_select_own"
on public.collection_item_tags
for select
to authenticated
using (
  exists (
    select 1
    from public.collection_items ci
    join public.collections c on c.id = ci.collection_id
    where ci.id = collection_item_tags.collection_item_id
      and c.user_id = (select auth.uid())
  )
);

drop policy if exists "collection_item_tags_insert_own" on public.collection_item_tags;
create policy "collection_item_tags_insert_own"
on public.collection_item_tags
for insert
to authenticated
with check (
  exists (
    select 1
    from public.collection_items ci
    join public.collections c on c.id = ci.collection_id
    where ci.id = collection_item_tags.collection_item_id
      and c.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.collection_tags ct
    where ct.id = collection_item_tags.tag_id
      and ct.user_id = (select auth.uid())
  )
);

drop policy if exists "collection_item_tags_delete_own" on public.collection_item_tags;
create policy "collection_item_tags_delete_own"
on public.collection_item_tags
for delete
to authenticated
using (
  exists (
    select 1
    from public.collection_items ci
    join public.collections c on c.id = ci.collection_id
    where ci.id = collection_item_tags.collection_item_id
      and c.user_id = (select auth.uid())
  )
);

revoke all on table public.collections from anon, authenticated;
revoke all on table public.collection_items from anon, authenticated;
revoke all on table public.collection_tags from anon, authenticated;
revoke all on table public.collection_item_tags from anon, authenticated;

grant select, insert, update, delete on table public.collections to authenticated;
grant select, insert, update, delete on table public.collection_items to authenticated;
grant select, insert, update, delete on table public.collection_tags to authenticated;
grant select, insert, delete on table public.collection_item_tags to authenticated;

grant update (username, display_name, headline, avatar_url) on table public.profiles to authenticated;

create or replace function public.set_collection_item_tags(
  p_collection_item_id uuid,
  p_tag_ids uuid[]
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_tag_ids uuid[];
  v_tag_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select c.user_id
  into v_owner_id
  from public.collection_items ci
  join public.collections c on c.id = ci.collection_id
  where ci.id = p_collection_item_id;

  if v_owner_id is null or v_owner_id <> v_user_id then
    raise exception 'Collection item not found.' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(distinct tag_id), '{}'::uuid[])
  into v_tag_ids
  from unnest(coalesce(p_tag_ids, '{}'::uuid[])) as selected(tag_id)
  where tag_id is not null;

  if cardinality(v_tag_ids) > 10 then
    raise exception 'A collection item can have at most 10 tags.'
      using errcode = '23514';
  end if;

  select count(*)
  into v_tag_count
  from public.collection_tags ct
  where ct.user_id = v_user_id
    and ct.id = any(v_tag_ids);

  if v_tag_count <> cardinality(v_tag_ids) then
    raise exception 'Collection tag not found.' using errcode = '23503';
  end if;

  delete from public.collection_item_tags
  where collection_item_id = p_collection_item_id;

  insert into public.collection_item_tags (collection_item_id, tag_id)
  select p_collection_item_id, selected.tag_id
  from unnest(v_tag_ids) as selected(tag_id);
end;
$$;

revoke all on function public.set_collection_item_tags(uuid, uuid[]) from public;
grant execute on function public.set_collection_item_tags(uuid, uuid[]) to authenticated;

commit;
