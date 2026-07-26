begin;

-- Serialize every tag mutation on the parent item. This protects both direct
-- Data API inserts and the replacement RPC from the classic count-then-insert
-- race that could otherwise exceed ten tags.
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
  where ci.id = new.collection_item_id
  for update of ci;

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

create or replace function public.set_collection_item_tags(
  p_collection_item_id uuid,
  p_tag_ids uuid[]
)
returns void
language plpgsql
security invoker
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
  where ci.id = p_collection_item_id
  for update of ci;

  if v_owner_id is null or v_owner_id <> v_user_id then
    raise exception 'Collection item not found.' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(distinct tag_id order by tag_id), '{}'::uuid[])
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

create or replace function public.create_collection_item_with_tags(
  p_collection_id uuid,
  p_video_id uuid,
  p_note text default '',
  p_sort_order integer default null,
  p_tag_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_item_id uuid;
  v_tag_ids uuid[];
  v_tag_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_collection_id is null or p_video_id is null then
    raise exception 'Collection and video are required.' using errcode = '22023';
  end if;

  if char_length(coalesce(p_note, '')) > 500 then
    raise exception 'Collection note is too long.' using errcode = '23514';
  end if;

  select c.user_id
  into v_owner_id
  from public.collections c
  where c.id = p_collection_id;

  if v_owner_id is null or v_owner_id <> v_user_id then
    raise exception 'Collection not found.' using errcode = 'P0002';
  end if;

  perform 1
  from public.videos v
  where v.id = p_video_id
    and v.published_at is not null;

  if not found then
    raise exception 'Published video not found.' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(distinct tag_id order by tag_id), '{}'::uuid[])
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

  insert into public.collection_items (
    collection_id,
    video_id,
    note,
    sort_order
  )
  values (
    p_collection_id,
    p_video_id,
    coalesce(p_note, ''),
    coalesce(p_sort_order, 0)
  )
  returning id into v_item_id;

  insert into public.collection_item_tags (collection_item_id, tag_id)
  select v_item_id, selected.tag_id
  from unnest(v_tag_ids) as selected(tag_id);

  return v_item_id;
end;
$$;

create or replace function public.update_collection_item_with_tags(
  p_collection_item_id uuid,
  p_note text default null,
  p_sort_order integer default null,
  p_tag_ids uuid[] default null
)
returns uuid
language plpgsql
security invoker
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

  if p_note is not null and char_length(p_note) > 500 then
    raise exception 'Collection note is too long.' using errcode = '23514';
  end if;

  select c.user_id
  into v_owner_id
  from public.collection_items ci
  join public.collections c on c.id = ci.collection_id
  where ci.id = p_collection_item_id
  for update of ci;

  if v_owner_id is null or v_owner_id <> v_user_id then
    raise exception 'Collection item not found.' using errcode = 'P0002';
  end if;

  if p_note is not null or p_sort_order is not null then
    update public.collection_items
    set
      note = coalesce(p_note, note),
      sort_order = coalesce(p_sort_order, sort_order)
    where id = p_collection_item_id;
  end if;

  if p_tag_ids is not null then
    select coalesce(array_agg(distinct tag_id order by tag_id), '{}'::uuid[])
    into v_tag_ids
    from unnest(p_tag_ids) as selected(tag_id)
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
  end if;

  return p_collection_item_id;
end;
$$;

revoke all on function public.set_collection_item_tags(uuid, uuid[]) from public;
revoke all on function public.create_collection_item_with_tags(uuid, uuid, text, integer, uuid[]) from public;
revoke all on function public.update_collection_item_with_tags(uuid, text, integer, uuid[]) from public;

grant execute on function public.set_collection_item_tags(uuid, uuid[]) to authenticated;
grant execute on function public.create_collection_item_with_tags(uuid, uuid, text, integer, uuid[]) to authenticated;
grant execute on function public.update_collection_item_with_tags(uuid, text, integer, uuid[]) to authenticated;

commit;
