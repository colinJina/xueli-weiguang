-- Run on a development database. All fixtures, including auth users, roll back.
begin;

create temporary table favorite_test_context on commit drop as
select gen_random_uuid() as owner_id, gen_random_uuid() as other_id,
  gen_random_uuid() as quota_owner_id, gen_random_uuid() as a,
  gen_random_uuid() as b, gen_random_uuid() as full_folder,
  gen_random_uuid() as foreign_folder, gen_random_uuid() as tag_id,
  array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()] as quota_folders;
create temporary table favorite_test_videos on commit drop as
select ordinal, gen_random_uuid() as id, gen_random_uuid() as submission_id,
  gen_random_uuid() as author_id, substr(md5(gen_random_uuid()::text),1,11) as external_id
from generate_series(1,302) as numbered(ordinal);
grant select on favorite_test_context, favorite_test_videos to authenticated;

insert into auth.users (id,email,aud,role)
select id,'favorite-sql-' || id::text || '@example.invalid','authenticated','authenticated'
from (
  select owner_id as id from favorite_test_context
  union all select other_id from favorite_test_context
  union all select quota_owner_id from favorite_test_context
  union all select author_id from favorite_test_videos
) as fixture_users;
insert into public.profiles (id)
select id from auth.users where email like 'favorite-sql-%@example.invalid'
on conflict (id) do nothing;

insert into public.collections (id,user_id,name)
select a,owner_id,'收藏甲' from favorite_test_context
union all select b,owner_id,'收藏乙' from favorite_test_context
union all select full_folder,owner_id,'已满' from favorite_test_context
union all select foreign_folder,other_id,'其他用户' from favorite_test_context;
insert into public.collections (id,user_id,name)
select folder,quota_owner_id,'配额' || ordinal
from favorite_test_context cross join unnest(quota_folders) with ordinality as folders(folder,ordinal);

insert into public.submissions (id,user_id,platform,storage_provider,external_id,source_url,status)
select submission_id,author_id,'youtube','youtube',external_id,
  'https://www.youtube.com/watch?v=' || external_id,'approved'
from favorite_test_videos;
insert into public.videos (id,submission_id,platform,storage_provider,source_url,embed_url,title,category_id,published_at)
select id,submission_id,'youtube','youtube','https://www.youtube.com/watch?v=' || external_id,
  'https://www.youtube.com/embed/' || external_id,'收藏事务测试',
  (select id from public.categories limit 1),now()
from favorite_test_videos;

insert into public.collection_items (collection_id,video_id,note)
select a,v.id,'保留的备注' from favorite_test_context cross join favorite_test_videos v where ordinal=1
union all select a,v.id,'' from favorite_test_context cross join favorite_test_videos v where ordinal=302;
insert into public.collection_tags (id,user_id,name)
select tag_id,owner_id,'保留标签' from favorite_test_context;
insert into public.collection_item_tags (collection_item_id,tag_id)
select ci.id,f.tag_id from favorite_test_context f
join public.collection_items ci on ci.collection_id=f.a
join favorite_test_videos v on v.id=ci.video_id and v.ordinal=1;
insert into public.collection_items (collection_id,video_id)
select full_folder,v.id from favorite_test_context cross join favorite_test_videos v where ordinal between 2 and 301;
insert into public.collection_items (collection_id,video_id)
select folder,v.id from favorite_test_context
cross join unnest(quota_folders) with ordinality as folders(folder,folder_ordinal)
cross join favorite_test_videos v
where (folder_ordinal between 1 and 3 and v.ordinal<=300) or (folder_ordinal=4 and v.ordinal<=100);
update public.videos set published_at=null where id in (select id from favorite_test_videos where ordinal=302);

select set_config('request.jwt.claims',json_build_object('sub',owner_id,'role','authenticated')::text,true)
from favorite_test_context;
set local role authenticated;

do $$
declare
  f record;
  v_video uuid;
  v_hidden uuid;
  v_original uuid;
  v_result uuid[];
begin
  select * into f from favorite_test_context;
  select id into v_video from favorite_test_videos where ordinal=1;
  select id into v_hidden from favorite_test_videos where ordinal=302;
  select id into v_original from public.collection_items where collection_id=f.a and video_id=v_video;

  perform public.set_video_collections(v_video,array[f.a,f.b,f.a]);
  perform public.set_video_collections(v_video,array[f.a,f.b]);
  if (select count(*) from public.collection_items where video_id=v_video)<>2 then
    raise exception 'Multi-select or idempotency failed';
  end if;
  if not exists (select 1 from public.collection_items where id=v_original and note='保留的备注')
    or not exists (select 1 from public.collection_item_tags where collection_item_id=v_original and tag_id=f.tag_id) then
    raise exception 'Retained annotations were rewritten';
  end if;

  begin
    perform public.set_video_collections(v_video,array[f.b,f.full_folder]);
    raise exception 'Full folder accepted';
  exception when check_violation then null;
  end;
  if not exists (select 1 from public.collection_items where id=v_original and note='保留的备注')
    or not exists (select 1 from public.collection_item_tags where collection_item_id=v_original) then
    raise exception 'Quota failure did not restore removed annotations';
  end if;
  begin
    perform public.set_video_collections(v_video,array[f.foreign_folder]);
    raise exception 'Foreign folder accepted';
  exception when no_data_found then null;
  end;
  if (select count(*) from public.collection_items where video_id=v_video)<>2 then
    raise exception 'Ownership failure changed membership';
  end if;
  begin
    perform public.set_video_collections(v_hidden,array[f.a,f.b]);
    raise exception 'Unavailable video accepted';
  exception when no_data_found then null;
  end;
  perform public.set_video_collections(v_hidden,'{}'::uuid[]);
  if exists (select 1 from public.collection_items where video_id=v_hidden) then
    raise exception 'Unavailable membership could not be removed';
  end if;
  perform public.set_video_collections(v_video,'{}'::uuid[]);
  if exists (select 1 from public.collection_item_tags where collection_item_id=v_original) then
    raise exception 'Removed annotation bindings remain';
  end if;
  if not exists (select 1 from public.collection_tags where id=f.tag_id) then
    raise exception 'Private tag library was deleted';
  end if;

  perform set_config('request.jwt.claims',json_build_object('sub',f.quota_owner_id,'role','authenticated')::text,true);
  v_result := public.set_video_collections(v_video,array[f.quota_folders[2],f.quota_folders[3],f.quota_folders[4],f.quota_folders[5]]);
  if cardinality(v_result)<>4 or (select count(*) from public.collection_items where collection_id=any(f.quota_folders))<>1000 then
    raise exception 'Moving at the global quota failed: selection %, rows %, current owner %',
      cardinality(v_result), (select count(*) from public.collection_items where collection_id=any(f.quota_folders)), auth.uid()=f.quota_owner_id;
  end if;
  begin
    perform public.set_video_collections(v_video,array[f.quota_folders[1],f.quota_folders[2],f.quota_folders[3],f.quota_folders[4],f.quota_folders[5]]);
    raise exception 'Global quota exceeded';
  exception when check_violation then null;
  end;
  if (select count(*) from public.collection_items where collection_id=any(f.quota_folders))<>1000 then
    raise exception 'Global quota failure changed membership';
  end if;
  perform set_config('request.jwt.claims','{}',true);
  begin
    perform public.set_video_collections(v_video,'{}'::uuid[]);
    raise exception 'Unauthenticated operation accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
select 'multi-select, idempotency, retained metadata, atomic rollback, ownership, unpublished videos, per-folder/global quotas and authentication passed' as result;
