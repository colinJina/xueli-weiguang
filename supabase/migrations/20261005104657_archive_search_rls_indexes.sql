-- Normalize inside PGroonga, so RLS can use its leakproof v2 keyword operator.
-- No changes to policies, tables, ranking or API contracts.
begin;

drop index public.idx_videos_search_title;
create index idx_videos_search_title on public.videos using pgroonga (title)
with (tokenizer='TokenNgram("unify_alphabet", false, "unify_symbol", false, "unify_digit", false)', normalizers='NormalizerAuto')
where published_at is not null;

drop index public.idx_videos_search_author;
create index idx_videos_search_author on public.videos using pgroonga (author_name)
with (tokenizer='TokenNgram("unify_alphabet", false, "unify_symbol", false, "unify_digit", false)', normalizers='NormalizerAuto')
where published_at is not null;

drop index public.idx_videos_search_description;
create index idx_videos_search_description on public.videos using pgroonga (description)
with (tokenizer='TokenNgram("unify_alphabet", false, "unify_symbol", false, "unify_digit", false)', normalizers='NormalizerAuto')
where published_at is not null;

drop index public.idx_tags_search_name;
create index idx_tags_search_name on public.tags using pgroonga (name)
with (tokenizer='TokenNgram("unify_alphabet", false, "unify_symbol", false, "unify_digit", false)', normalizers='NormalizerAuto');

drop index public.idx_categories_search_name;
create index idx_categories_search_name on public.categories using pgroonga (name)
with (tokenizer='TokenNgram("unify_alphabet", false, "unify_symbol", false, "unify_digit", false)', normalizers='NormalizerAuto');

create or replace function public.search_archive_video_feed(
  p_query text default '',
  p_source_url text default null,
  p_category_id uuid default null,
  p_tag_ids uuid[] default array[]::uuid[],
  p_color_group_keys text[] default array[]::text[],
  p_colors jsonb default '[]'::jsonb,
  p_color_match_mode text default 'any',
  p_limit integer default 24,
  p_after_rank integer default null,
  p_after_published_at timestamptz default null,
  p_after_id uuid default null
)
returns jsonb
language plpgsql stable security invoker
set search_path = ''
set timezone = 'UTC'
as $$
declare
  q text := lower(btrim(regexp_replace(pg_catalog.normalize(coalesce(p_query, ''), 'NFKC'), '[[:space:]]+', ' ', 'g')));
  words text[] := case when q = '' then array[]::text[] else regexp_split_to_array(q, ' ') end;
  colors jsonb := '[]'::jsonb;
  entry jsonb;
  precision_value numeric;
  group_keys text[] := coalesce(p_color_group_keys, array[]::text[]);
  batch_limit integer := greatest(1, least(coalesce(p_limit, 24), 48));
  result jsonb;
begin
  if (q = '') = (p_source_url is null)
     or char_length(q) > 120 or cardinality(words) > 8
     or (p_source_url is not null and (
       char_length(p_source_url) > 2048
       or p_source_url !~ '^https://www\.(bilibili\.com/video/BV[0-9A-Za-z]{10}|youtube\.com/watch\?v=[0-9A-Za-z_-]{11})$'
     )) then
    raise exception 'Invalid search input.' using errcode = '22023';
  end if;
  if not (
    (p_after_rank is null and p_after_published_at is null and p_after_id is null)
    or (p_after_rank is not null and p_after_published_at is not null and p_after_id is not null and p_after_rank between 0 and 1564)
  ) then
    raise exception 'All search cursor fields are required.' using errcode = '22023';
  end if;
  if cardinality(coalesce(p_tag_ids, array[]::uuid[])) > 10 or array_position(p_tag_ids, null) is not null then
    raise exception 'Select at most 10 non-null tags.' using errcode = '22023';
  end if;
  if p_color_match_mode is null or p_color_match_mode not in ('any', 'all') then
    raise exception 'Color match mode must be any or all.' using errcode = '22023';
  end if;
  if cardinality(group_keys) > 10 or exists (
    select 1 from unnest(group_keys) key where key is null or key not in ('red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'brown', 'neutral')
  ) then
    raise exception 'Unknown color group.' using errcode = '22023';
  end if;
  if p_colors is null or jsonb_typeof(p_colors) is distinct from 'array' then
    raise exception 'Colors must be an array.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_colors) > 3 then
    raise exception 'Select at most 3 filter colors.' using errcode = '22023';
  end if;
  for entry in select value from jsonb_array_elements(p_colors) loop
    if jsonb_typeof(entry) is distinct from 'object' or jsonb_typeof(entry -> 'hex') is distinct from 'string' then
      raise exception 'Each filter color must contain a HEX string.' using errcode = '22023';
    end if;
    precision_value := 30;
    if entry ? 'precision' then
      if jsonb_typeof(entry -> 'precision') is distinct from 'number' then
        raise exception 'Color precision must be an integer from 1 to 100.' using errcode = '22023';
      end if;
      precision_value := (entry ->> 'precision')::numeric;
      if precision_value < 1 or precision_value > 100 or precision_value <> trunc(precision_value) then
        raise exception 'Color precision must be an integer from 1 to 100.' using errcode = '22023';
      end if;
    end if;
    colors := colors || jsonb_build_array(jsonb_build_object('hex', public.normalize_color_hex(entry ->> 'hex'), 'precision', precision_value));
  end loop;

  with terms as materialized (
    -- &@ is a single literal keyword operator, with leakproof RLS support.
    select distinct word from unnest(words) word
  ),
  term_hits as (
    select v.id, term.word, 8 as weight
    from terms term join public.videos v
      on v.title operator(extensions.&@) (term.word, null, 'public.idx_videos_search_title')::extensions.pgroonga_full_text_search_condition
    where v.published_at is not null
    union all
    select v.id, term.word, 6
    from terms term join public.videos v
      on v.author_name operator(extensions.&@) (term.word, null, 'public.idx_videos_search_author')::extensions.pgroonga_full_text_search_condition
    where v.published_at is not null
    union all
    select v.id, term.word, 1
    from terms term join public.videos v
      on v.description operator(extensions.&@) (term.word, null, 'public.idx_videos_search_description')::extensions.pgroonga_full_text_search_condition
    where v.published_at is not null
    union all
    select vt.video_id, term.word, 4
    from terms term join public.tags t
      on t.name operator(extensions.&@) (term.word, null, 'public.idx_tags_search_name')::extensions.pgroonga_full_text_search_condition
    join public.video_tags vt on vt.tag_id = t.id
    union all
    select v.id, term.word, 4
    from terms term join public.categories c
      on c.name operator(extensions.&@) (term.word, null, 'public.idx_categories_search_name')::extensions.pgroonga_full_text_search_condition
    join public.videos v on v.category_id = c.id
    where v.published_at is not null
  ),
  best_hits as (
    select id, word, max(weight) as weight from term_hits group by id, word
  ),
  text_ranks as (
    select id, sum(weight)::integer as rank
    from best_hits group by id
    having count(*) = (select count(*) from terms)
  ),
  search_ranks as (
    select id, rank from text_ranks
    union all
    select v.id, 0 from public.videos v
    where p_source_url is not null and v.published_at is not null
      and (v.source_url = p_source_url or (
        p_source_url like 'https://www.bilibili.com/%' and v.source_url = p_source_url || '/'
      ))
  ),
  targets as materialized (
    select color ->> 'hex' as hex,
           (100 - (color ->> 'precision')::integer)::double precision as threshold
    from jsonb_array_elements(colors) color
  ),
  ranked as (
    select v.id, v.published_at,
      sr.rank
      + case when q <> '' and lower(btrim(regexp_replace(pg_catalog.normalize(v.title, 'NFKC'), '[[:space:]]+', ' ', 'g'))) = q then 1000 else 0 end
      + case when q <> '' and lower(btrim(regexp_replace(pg_catalog.normalize(coalesce(v.author_name, ''), 'NFKC'), '[[:space:]]+', ' ', 'g'))) = q then 500 else 0 end as rank
    from search_ranks sr join public.videos v on v.id = sr.id
    where v.published_at is not null
      and (p_category_id is null or v.category_id = p_category_id)
      and (cardinality(coalesce(p_tag_ids, array[]::uuid[])) = 0 or exists (
        select 1 from public.video_tags vt where vt.video_id = v.id and vt.tag_id = any(p_tag_ids)
      ))
      and (cardinality(group_keys) = 0 or exists (
        select 1 from public.video_tones vt join public.tones t on t.id = vt.tone_id
        where vt.video_id = v.id and public.tone_color_group(t.color_hex) = any(group_keys)
      ))
      and (jsonb_array_length(colors) = 0 or
        (p_color_match_mode = 'any' and exists (
          select 1 from public.video_tones vt join public.tones t on t.id = vt.tone_id cross join targets
          where vt.video_id = v.id and public.color_weighted_rgb_distance(t.color_hex, targets.hex) <= targets.threshold
        )) or
        (p_color_match_mode = 'all' and not exists (
          select 1 from targets where not exists (
            select 1 from public.video_tones vt join public.tones t on t.id = vt.tone_id
            where vt.video_id = v.id and public.color_weighted_rgb_distance(t.color_hex, targets.hex) <= targets.threshold
          )
        ))
      )
  ),
  batch_ids as materialized (
    select id, published_at, rank from ranked
    where p_after_rank is null or (rank, published_at, id) < (p_after_rank, p_after_published_at, p_after_id)
    order by rank desc, published_at desc, id desc
    limit batch_limit + 1
  ),
  page_ids as materialized (
    select id, published_at, rank from batch_ids
    order by rank desc, published_at desc, id desc limit batch_limit
  ),
  continuation as (
    select count(*) > batch_limit as has_more from batch_ids
  ),
  paged as (
    select v.id, v.platform, v.storage_provider, v.title, v.cover_url, v.author_name,
           v.view_count, v.like_count, v.category_id, v.published_at, v.created_at, page_ids.rank,
           null::text as source_url, null::text as embed_url, null::text as playback_ref,
           null::text as description, null::text as author_avatar,
           jsonb_build_object('id', c.id, 'name', c.name) as category,
           coalesce((
             select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name) order by t.name, t.id)
             from public.video_tags vt join public.tags t on t.id = vt.tag_id where vt.video_id = v.id
           ), '[]'::jsonb) as tags,
           coalesce((
             select jsonb_agg(to_jsonb(palette) order by palette.sort_order, palette.id) from (
               select t.id, t.name, t.color_hex, vt.percentage, vt.sort_order
               from public.video_tones vt join public.tones t on t.id = vt.tone_id
               where vt.video_id = v.id order by vt.sort_order, t.id limit 5
             ) palette
           ), '[]'::jsonb) as tones
    from page_ids join public.videos v on v.id = page_ids.id
    join public.categories c on c.id = v.category_id
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(to_jsonb(paged) order by rank desc, published_at desc, id desc) from paged), '[]'::jsonb),
    'has_more', continuation.has_more,
    'next_cursor', case when continuation.has_more then (
      select jsonb_build_object('rank', rank, 'published_at', published_at, 'id', id)
      from page_ids order by rank asc, published_at asc, id asc limit 1
    ) else null end
  ) into result from continuation;
  return result;
end;
$$;

revoke all on function public.search_archive_video_feed(text, text, uuid, uuid[], text[], jsonb, text, integer, integer, timestamptz, uuid) from public;
grant execute on function public.search_archive_video_feed(text, text, uuid, uuid[], text[], jsonb, text, integer, integer, timestamptz, uuid) to anon, authenticated;
comment on function public.search_archive_video_feed(text, text, uuid, uuid[], text[], jsonb, text, integer, integer, timestamptz, uuid)
is 'RLS-respecting literal archive search with deterministic ranking, keyset pagination and batched card relations.';

commit;
