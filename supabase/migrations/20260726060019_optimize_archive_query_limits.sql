begin;

drop index if exists public.idx_videos_public_archive_published_at;
drop index if exists public.idx_videos_public_archive_category_published_at;

create index idx_videos_public_archive_published_at
on public.videos (published_at desc, id desc)
where published_at is not null;

create index idx_videos_public_archive_category_published_at
on public.videos (category_id, published_at desc, id desc)
where published_at is not null;

create or replace function public.get_archive_videos(
  p_category_id uuid default null,
  p_tag_ids uuid[] default array[]::uuid[],
  p_tone_family_keys text[] default array[]::text[],
  p_limit integer default 24,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with args as (
    select
      greatest(1, least(coalesce(p_limit, 24), 48)) as page_limit,
      least(greatest(0, coalesce(p_offset, 0)), 11976) as page_offset,
      (coalesce(p_tag_ids, array[]::uuid[]))[1:10] as tag_ids,
      (coalesce(p_tone_family_keys, array[]::text[]))[1:10] as tone_family_keys
  ),
  filtered_ids as materialized (
    select
      v.id,
      v.published_at
    from public.videos v
    cross join args
    where v.published_at is not null
      and (p_category_id is null or v.category_id = p_category_id)
      and (
        cardinality(args.tag_ids) = 0
        or exists (
          select 1
          from public.video_tags vt
          where vt.video_id = v.id
            and vt.tag_id = any(args.tag_ids)
        )
      )
      and (
        cardinality(args.tone_family_keys) = 0
        or exists (
          select 1
          from public.video_tones vtone
          join public.tones tone on tone.id = vtone.tone_id
          join public.tone_families family on family.id = tone.family_id
          where vtone.video_id = v.id
            and family.is_active = true
            and family.key = any(args.tone_family_keys)
        )
      )
  ),
  total as (
    select count(*) as total_count
    from filtered_ids
  ),
  paged_ids as (
    select filtered_ids.id, filtered_ids.published_at
    from filtered_ids
    cross join args
    order by filtered_ids.published_at desc, filtered_ids.id desc
    limit (select page_limit from args)
    offset (select page_offset from args)
  ),
  paged as (
    select
      v.id,
      v.platform,
      v.storage_provider,
      v.source_url,
      v.embed_url,
      v.playback_ref,
      v.title,
      v.cover_url,
      v.description,
      v.author_name,
      v.author_avatar,
      v.view_count,
      v.like_count,
      v.category_id,
      v.published_at,
      v.created_at
    from paged_ids
    join public.videos v on v.id = paged_ids.id
    order by paged_ids.published_at desc, paged_ids.id desc
  )
  select jsonb_build_object(
    'total_count',
    total.total_count,
    'items',
    coalesce(
      (
        select jsonb_agg(to_jsonb(paged) order by paged.published_at desc, paged.id desc)
        from paged
      ),
      '[]'::jsonb
    )
  )
  from total;
$$;

revoke all on function public.get_archive_videos(uuid, uuid[], text[], integer, integer) from public;
grant execute on function public.get_archive_videos(uuid, uuid[], text[], integer, integer) to anon, authenticated;

commit;
