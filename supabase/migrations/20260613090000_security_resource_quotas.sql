begin;

create or replace function private.enforce_user_collection_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  collection_count integer;
begin
  if tg_op = 'UPDATE' and new.user_id = old.user_id then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(new.user_id::text),
    pg_catalog.hashtext('collections_quota')
  );

  select count(*)
  into collection_count
  from public.collections
  where user_id = new.user_id
    and id <> new.id;

  if collection_count >= 20 then
    raise exception 'user_collection_limit_exceeded'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_user_collection_limit on public.collections;
create trigger enforce_user_collection_limit
before insert or update of user_id on public.collections
for each row
execute function private.enforce_user_collection_limit();

create or replace function private.enforce_user_collection_tag_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  tag_count integer;
begin
  if tg_op = 'UPDATE' and new.user_id = old.user_id then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(new.user_id::text),
    pg_catalog.hashtext('collection_tags_quota')
  );

  select count(*)
  into tag_count
  from public.collection_tags
  where user_id = new.user_id
    and id <> new.id;

  if tag_count >= 50 then
    raise exception 'user_collection_tag_limit_exceeded'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_user_collection_tag_limit on public.collection_tags;
create trigger enforce_user_collection_tag_limit
before insert or update of user_id on public.collection_tags
for each row
execute function private.enforce_user_collection_tag_limit();

create or replace function private.enforce_collection_item_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  owner_id uuid;
  user_item_count integer;
  collection_item_count integer;
begin
  if tg_op = 'UPDATE' and new.collection_id = old.collection_id then
    return new;
  end if;

  select user_id
  into owner_id
  from public.collections
  where id = new.collection_id;

  if owner_id is null then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(owner_id::text),
    pg_catalog.hashtext('collection_items_quota')
  );

  select count(*)
  into user_item_count
  from public.collection_items ci
  join public.collections c on c.id = ci.collection_id
  where c.user_id = owner_id
    and ci.id <> new.id;

  if user_item_count >= 1000 then
    raise exception 'user_collection_item_limit_exceeded'
      using errcode = '23514';
  end if;

  select count(*)
  into collection_item_count
  from public.collection_items
  where collection_id = new.collection_id
    and id <> new.id;

  if collection_item_count >= 300 then
    raise exception 'collection_item_per_collection_limit_exceeded'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_collection_item_quota on public.collection_items;
create trigger enforce_collection_item_quota
before insert or update of collection_id on public.collection_items
for each row
execute function private.enforce_collection_item_quota();

create or replace function private.enforce_bilibili_submission_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  pending_count integer;
  daily_count integer;
begin
  if new.storage_provider <> 'bilibili' or new.status <> 'pending' then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(new.user_id::text),
    pg_catalog.hashtext('bilibili_submissions_quota')
  );

  select count(*)
  into pending_count
  from public.submissions
  where user_id = new.user_id
    and storage_provider = 'bilibili'
    and status = 'pending'
    and id <> new.id;

  if pending_count >= 20 then
    raise exception 'bilibili_pending_submission_limit_exceeded'
      using errcode = '23514';
  end if;

  select count(*)
  into daily_count
  from public.submissions
  where user_id = new.user_id
    and storage_provider = 'bilibili'
    and created_at >= now() - interval '24 hours'
    and id <> new.id;

  if daily_count >= 50 then
    raise exception 'bilibili_daily_submission_limit_exceeded'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_bilibili_submission_quota on public.submissions;
create trigger enforce_bilibili_submission_quota
before insert or update of user_id, storage_provider, status on public.submissions
for each row
execute function private.enforce_bilibili_submission_quota();

commit;
