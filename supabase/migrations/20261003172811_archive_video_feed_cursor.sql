-- Requires the realtime palette expansion (normalize_color_hex, tone_color_group,
-- color_weighted_rgb_distance and video_tones.percentage/sort_order).
-- Additive: the legacy page/count RPC remains available to the homepage and old callers.
begin;

create index if not exists idx_videos_public_archive_published_at
on public.videos (published_at desc, id desc) where published_at is not null;
create index if not exists idx_videos_public_archive_category_published_at
on public.videos (category_id, published_at desc, id desc) where published_at is not null;

create or replace function public.get_archive_video_feed(
  p_category_id uuid default null,
  p_tag_ids uuid[] default array[]::uuid[],
  p_color_group_keys text[] default array[]::text[],
  p_colors jsonb default '[]'::jsonb,
  p_color_match_mode text default 'any',
  p_limit integer default 24,
  p_after_published_at timestamptz default null,
  p_after_id uuid default null
)
returns jsonb
language plpgsql stable security invoker
set search_path = ''
-- Cursor strings must not depend on the connection's/session's timezone.
set timezone = 'UTC'
as $$
declare
  colors jsonb := '[]'::jsonb;
  entry jsonb;
  precision_value numeric;
  group_keys text[] := coalesce(p_color_group_keys, array[]::text[]);
  result jsonb;
begin
  if (p_after_published_at is null) <> (p_after_id is null) then
    raise exception 'Both cursor fields are required.' using errcode = '22023';
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

  with targets as materialized (
    select color ->> 'hex' as hex,
           (100 - (color ->> 'precision')::integer)::double precision as threshold
    from jsonb_array_elements(colors) color
  ),
  batch_ids as materialized (
    select v.id, v.published_at
    from public.videos v
    where v.published_at is not null
      and (p_after_published_at is null or (v.published_at, v.id) < (p_after_published_at, p_after_id))
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
    order by v.published_at desc, v.id desc
    limit greatest(1, least(coalesce(p_limit, 24), 48)) + 1
  ),
  page_ids as materialized (
    select id, published_at from batch_ids
    order by published_at desc, id desc
    limit greatest(1, least(coalesce(p_limit, 24), 48))
  ),
  continuation as (
    select count(*) > greatest(1, least(coalesce(p_limit, 24), 48)) as has_more from batch_ids
  ),
  paged as (
    -- Avoid shipping full descriptions, source/player URLs or avatars in an archive feed.
    select v.id, v.platform, v.storage_provider, v.title, v.cover_url, v.author_name,
           v.view_count, v.like_count, v.category_id, v.published_at, v.created_at,
           null::text as source_url, null::text as embed_url, null::text as playback_ref,
           null::text as description, null::text as author_avatar
    from page_ids join public.videos v on v.id = page_ids.id
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(to_jsonb(paged) order by published_at desc, id desc) from paged), '[]'::jsonb),
    'has_more', continuation.has_more,
    'next_cursor', case when continuation.has_more then (
      select jsonb_build_object('published_at', published_at, 'id', id)
      from page_ids order by published_at asc, id asc limit 1
    ) else null end
  ) into result from continuation;
  return result;
end;
$$;

revoke all on function public.get_archive_video_feed(uuid, uuid[], text[], jsonb, text, integer, timestamptz, uuid) from public;
grant execute on function public.get_archive_video_feed(uuid, uuid[], text[], jsonb, text, integer, timestamptz, uuid) to anon, authenticated;
comment on function public.get_archive_video_feed(uuid, uuid[], text[], jsonb, text, integer, timestamptz, uuid)
is 'Public archive cursor feed. RLS applies; bounded batch, no full count or OFFSET.';

commit;
