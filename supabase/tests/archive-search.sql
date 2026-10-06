-- Run only against a database with the archive search migration installed.
-- All fixtures/functions/indexes live in pg_temp and disappear on ROLLBACK.
-- This never inserts into or changes public tables.
begin;

create temp table videos as select * from public.videos with no data;
create temp table categories (id uuid primary key, name text);
create temp table tags (id uuid primary key, name text);
create temp table tones (id uuid primary key, name text, color_hex text);
create temp table video_tags (video_id uuid, tag_id uuid, primary key(video_id, tag_id));
create temp table video_tones (video_id uuid, tone_id uuid, percentage numeric, sort_order integer, primary key(video_id, tone_id));
create temp table search_timings (query text, n integer, elapsed_ms double precision);

insert into categories values ('a0000000-0000-4000-8000-000000000001', '动画'), ('a0000000-0000-4000-8000-000000000002', '极简');
insert into tags values ('b0000000-0000-4000-8000-000000000001', '排字');
insert into tones values ('c0000000-0000-4000-8000-000000000001', '蓝色', '#112233');
insert into videos (id, platform, storage_provider, title, author_name, description, cover_url, source_url, embed_url, view_count, like_count, category_id, published_at, created_at)
select ('80000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'cos', 'cos', 'PV 动画 ' || n, '动画师', '动画参考', null, null, null, 0, 0,
  'a0000000-0000-4000-8000-000000000001'::uuid,
  '2026-10-05T00:00:00.123456+00'::timestamptz, '2026-10-05T00:00:00+00'::timestamptz
from generate_series(1,10000) n;
update videos set title='极简 排字' where id in ('80000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000008');
update videos set title='极简', author_name='排字' where id='80000000-0000-4000-8000-000000000002';
update videos set title='其他', description='极简 排字' where id='80000000-0000-4000-8000-000000000003';
update videos set title='PV 100% _test ' || chr(92) || ' OR -tag ＰＶ', platform='bilibili', storage_provider='bilibili', source_url='https://www.bilibili.com/video/BV1xx411c7mD' where id='80000000-0000-4000-8000-000000000004';
update videos set title='unpublished sentinel', published_at=null where id='80000000-0000-4000-8000-000000000005';
update videos set title='其他', author_name='极简 排字', description=null where id='80000000-0000-4000-8000-000000000006';
update videos set title='极简' where id='80000000-0000-4000-8000-000000000007';
update videos set title='😀', category_id='a0000000-0000-4000-8000-000000000002' where id='80000000-0000-4000-8000-000000000010';
update videos set title='雪笠 / キラキラ ＰＶabc', description=null where id='80000000-0000-4000-8000-000000000011';
update videos set title='YouTube fixture', platform='youtube', storage_provider='youtube', source_url='https://www.youtube.com/watch?v=dQw4w9WgXcQ' where id='80000000-0000-4000-8000-000000000012';
insert into video_tags values ('80000000-0000-4000-8000-000000000007','b0000000-0000-4000-8000-000000000001');
insert into video_tones values ('80000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001',50,0), ('80000000-0000-4000-8000-000000000007','c0000000-0000-4000-8000-000000000001',50,0);

-- Clone the installed function and search indexes; use its actual implementation.
do $clone$
declare definition text; relation text; index_oid oid;
begin
  definition := pg_get_functiondef('public.search_archive_video_feed(text,text,uuid,uuid[],text[],jsonb,text,integer,integer,timestamptz,uuid)'::regprocedure);
  definition := replace(definition, 'public.search_archive_video_feed', 'pg_temp.search_archive_video_feed');
  foreach relation in array array['videos','categories','tags','tones','video_tags','video_tones'] loop
    definition := replace(definition, 'public.' || relation || ' ', 'pg_temp.' || relation || ' ');
  end loop;
  execute definition;
  for index_oid in select indexrelid from pg_index join pg_class on pg_class.oid=indexrelid where relnamespace='public'::regnamespace and relname like '%search%' loop
    definition := pg_get_indexdef(index_oid);
    foreach relation in array array['videos','categories','tags'] loop
      definition := replace(definition, 'public.' || relation || ' ', 'pg_temp.' || relation || ' ');
    end loop;
    execute definition;
  end loop;
end $clone$;
create index search_fixture_videos_id on videos(id);
create index search_fixture_category on videos(category_id);
create index search_fixture_video_tags_reverse on video_tags(tag_id,video_id);
analyze videos;
analyze categories;
analyze tags;
analyze video_tags;
analyze video_tones;
grant select on videos,categories,tags,tones,video_tags,video_tones to anon,authenticated;
grant select,insert on search_timings to anon;
grant execute on function pg_temp.search_archive_video_feed(text,text,uuid,uuid[],text[],jsonb,text,integer,integer,timestamptz,uuid) to anon,authenticated;
alter table videos enable row level security;
create policy fixture_public_videos on videos for select to anon,authenticated using(published_at is not null);
set local role anon;

do $verify$
declare
  feed jsonb; next_feed jsonb; word text; ids text[]; expected text[] := array[
    '80000000-0000-4000-8000-000000000008','80000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000006','80000000-0000-4000-8000-000000000002',
    '80000000-0000-4000-8000-000000000007','80000000-0000-4000-8000-000000000003'
  ];
begin
  feed := pg_temp.search_archive_video_feed(p_query=>'极简 排字');
  select array_agg(item->>'id' order by ordinal) into ids from jsonb_array_elements(feed->'items') with ordinality as result(item,ordinal);
  if ids is distinct from expected then raise exception 'Cross-field ranking failed: %',ids; end if;
  feed := pg_temp.search_archive_video_feed(p_query=>'笠 キラ PvAB');
  if jsonb_array_length(feed->'items') <> 1 or feed->'items'->0->>'rank' <> '24' then raise exception 'Mixed-language fragment or case normalization failed'; end if;
  foreach word in array array['%', '_test', chr(92), 'OR', '-tag', '😀'] loop
    feed := pg_temp.search_archive_video_feed(p_query=>word);
    if jsonb_array_length(feed->'items') <> 1 then raise exception 'Literal query failed: %',word; end if;
  end loop;
  feed := pg_temp.search_archive_video_feed(p_query=>'ＰＶ');
  if jsonb_array_length(feed->'items') <> 24 or not (feed->>'has_more')::boolean then raise exception 'Fullwidth query failed'; end if;
  next_feed := pg_temp.search_archive_video_feed(
    p_query=>'pv', p_after_rank=>(feed->'next_cursor'->>'rank')::integer,
    p_after_published_at=>(feed->'next_cursor'->>'published_at')::timestamptz,
    p_after_id=>(feed->'next_cursor'->>'id')::uuid
  );
  if exists (select 1 from jsonb_array_elements(feed->'items') a join jsonb_array_elements(next_feed->'items') b on a->>'id'=b->>'id') then raise exception 'Cursor repeated a row'; end if;
  if feed->'next_cursor'->>'published_at' <> '2026-10-05T00:00:00.123456+00:00' then raise exception 'Microsecond cursor lost precision'; end if;
  feed := pg_temp.search_archive_video_feed(p_query=>'极简 排字', p_colors=>'[{"hex":"#112233","precision":100}]', p_limit=>1);
  if feed->'items'->0->>'id' <> '80000000-0000-4000-8000-000000000001' or not (feed->>'has_more')::boolean then raise exception 'Color filter applied after pagination'; end if;
  feed := pg_temp.search_archive_video_feed(p_source_url=>'https://www.bilibili.com/video/BV1xx411c7mD');
  if jsonb_array_length(feed->'items') <> 1 or feed->'items'->0->>'description' is not null then raise exception 'Source lookup or private payload failed'; end if;
  feed := pg_temp.search_archive_video_feed(p_source_url=>'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  if jsonb_array_length(feed->'items') <> 1 or feed->'items'->0->>'id' <> '80000000-0000-4000-8000-000000000012' then raise exception 'YouTube source lookup failed'; end if;
  feed := pg_temp.search_archive_video_feed(p_query=>'极简',p_tag_ids=>array['b0000000-0000-4000-8000-000000000001']::uuid[],p_colors=>'[{"hex":"#112233","precision":100}]',p_color_match_mode=>'all');
  if jsonb_array_length(feed->'items') <> 1 or feed->'items'->0->>'id' <> '80000000-0000-4000-8000-000000000007' then raise exception 'Tag/all-color combination failed'; end if;
  feed := pg_temp.search_archive_video_feed(p_query=>'unpublished sentinel');
  if jsonb_array_length(feed->'items') <> 0 then raise exception 'Unpublished PV leaked'; end if;
  feed := pg_temp.search_archive_video_feed(p_query=>'極端不存在9a3');
  if jsonb_array_length(feed->'items') <> 0 or (feed->>'has_more')::boolean or feed->'next_cursor' <> 'null'::jsonb then raise exception 'Empty result failed'; end if;
  begin
    perform pg_temp.search_archive_video_feed(p_query=>'pv',p_after_rank=>8);
    raise exception 'Malformed cursor was accepted';
  exception when invalid_parameter_value then null; end;
end $verify$;

set local role authenticated;
do $authenticated$
begin
  if jsonb_array_length(pg_temp.search_archive_video_feed(p_query=>'unpublished sentinel')->'items') <> 0 then
    raise exception 'Authenticated search exposed unpublished PV';
  end if;
  if jsonb_array_length(pg_temp.search_archive_video_feed(p_query=>'笠 キラ PvAB')->'items') <> 1 then
    raise exception 'Authenticated search permissions failed';
  end if;
end $authenticated$;
set local role anon;

do $benchmark$
declare word text; started timestamptz; i integer;
begin
  foreach word in array array['pv','极简 排字','極端不存在9a3','动画'] loop
    for i in 0..6 loop
      started := clock_timestamp();
      perform pg_temp.search_archive_video_feed(p_query=>word);
      insert into search_timings values(word,i,extract(epoch from clock_timestamp()-started)*1000);
    end loop;
  end loop;
end $benchmark$;
select query, round(min(elapsed_ms)::numeric,2) as min_ms,
  round((percentile_cont(0.5) within group(order by elapsed_ms))::numeric,2) as p50_ms,
  round((percentile_cont(0.95) within group(order by elapsed_ms))::numeric,2) as p95_ms
from search_timings where n>0 group by query order by query;
rollback;
