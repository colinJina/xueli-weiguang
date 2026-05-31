begin;

create or replace function private.enforce_video_tag_limit()
returns trigger
language plpgsql
set search_path = pg_temp
as $$
declare
  tag_count integer;
begin
  if tg_op = 'UPDATE' and new.video_id = old.video_id then
    return new;
  end if;

  select count(*)
  into tag_count
  from public.video_tags
  where video_id = new.video_id;

  if tag_count >= 4 then
    raise exception using
      errcode = '23514',
      message = format('video %s cannot have more than 4 tags', new.video_id);
  end if;

  return new;
end;
$$;

create or replace function private.enforce_video_tone_max()
returns trigger
language plpgsql
set search_path = pg_temp
as $$
declare
  tone_count integer;
begin
  if tg_op = 'UPDATE' and new.video_id = old.video_id then
    return new;
  end if;

  select count(*)
  into tone_count
  from public.video_tones
  where video_id = new.video_id;

  if tone_count >= 3 then
    raise exception using
      errcode = '23514',
      message = format('video %s cannot have more than 3 tones', new.video_id);
  end if;

  return new;
end;
$$;

create or replace function private.assert_video_has_exactly_three_tones(target_video_id uuid)
returns void
language plpgsql
set search_path = pg_temp
as $$
declare
  tone_count integer;
begin
  if target_video_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.videos
    where id = target_video_id
  ) then
    return;
  end if;

  select count(*)
  into tone_count
  from public.video_tones
  where video_id = target_video_id;

  if tone_count <> 3 then
    raise exception using
      errcode = '23514',
      message = format('video %s must have exactly 3 tones, found %s', target_video_id, tone_count);
  end if;
end;
$$;

create or replace function private.enforce_video_tone_count_from_videos()
returns trigger
language plpgsql
set search_path = pg_temp
as $$
begin
  perform private.assert_video_has_exactly_three_tones(new.id);
  return null;
end;
$$;

create or replace function private.enforce_video_tone_count_from_video_tones()
returns trigger
language plpgsql
set search_path = pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform private.assert_video_has_exactly_three_tones(old.video_id);
  else
    perform private.assert_video_has_exactly_three_tones(new.video_id);
    if tg_op = 'UPDATE' and new.video_id <> old.video_id then
      perform private.assert_video_has_exactly_three_tones(old.video_id);
    end if;
  end if;

  return null;
end;
$$;

commit;
