begin;

-- Replace folder memberships atomically without rewriting retained notes or tags.
create or replace function public.set_video_collections(
  p_video_id uuid,
  p_collection_ids uuid[]
)
returns uuid[]
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_ids uuid[];
  v_existing uuid[];
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_video_id is null or p_collection_ids is null
    or cardinality(p_collection_ids) > 20
    or array_position(p_collection_ids, null) is not null then
    raise exception 'Invalid collection selection.' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct id order by id), '{}'::uuid[])
  into v_ids from unnest(p_collection_ids) as selected(id);

  -- Match the quota trigger's lock, including simultaneous single-folder inserts.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(v_user_id::text),
    pg_catalog.hashtext('collection_items_quota')
  );

  select count(*) into v_count
  from public.collections c
  where c.user_id = v_user_id and c.id = any(v_ids);
  if v_count <> cardinality(v_ids) then
    raise exception 'Collection not found.' using errcode = 'P0002';
  end if;

  -- A deterministic row lock order also protects retained annotation rows.
  perform ci.id from public.collection_items ci
  join public.collections c on c.id = ci.collection_id
  where c.user_id = v_user_id and ci.video_id = p_video_id
  order by ci.id for update of ci;

  select coalesce(array_agg(ci.collection_id), '{}'::uuid[]) into v_existing
  from public.collection_items ci
  join public.collections c on c.id = ci.collection_id
  where c.user_id = v_user_id and ci.video_id = p_video_id;

  if exists (select 1 from unnest(v_ids) as selected(id) where not (id = any(v_existing))) then
    perform v.id from public.videos v
    where v.id = p_video_id and v.published_at is not null;
    if not found then
      raise exception 'Published video not found.' using errcode = 'P0002';
    end if;
  end if;

  delete from public.collection_items ci
  using public.collections c
  where c.id = ci.collection_id and c.user_id = v_user_id
    and ci.video_id = p_video_id and not (ci.collection_id = any(v_ids));

  -- Delete first so moving a video at the user quota does not need spare capacity.
  -- Existing insert triggers enforce per-folder and per-user quotas; errors roll back everything.
  insert into public.collection_items (collection_id, video_id)
  select id, p_video_id from unnest(v_ids) as selected(id)
  where not (id = any(v_existing))
  order by id;

  return v_ids;
end;
$$;

revoke all on function public.set_video_collections(uuid, uuid[]) from public, anon;
grant execute on function public.set_video_collections(uuid, uuid[]) to authenticated;

commit;
