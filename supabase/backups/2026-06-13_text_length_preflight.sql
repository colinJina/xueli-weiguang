-- Run before validating 20260613091000_text_field_length_guards.sql constraints.
-- Any returned row must be reviewed and cleaned up before running VALIDATE CONSTRAINT.

select 'profiles.username' as field, id::text as row_id, char_length(username) as length
from public.profiles
where username is not null
  and (
    char_length(btrim(username)) not between 1 and 30
    or btrim(username) !~ '^[A-Za-z0-9_.-]+$'
  )
union all
select 'categories.name', id::text, char_length(name)
from public.categories
where char_length(btrim(name)) not between 1 and 40
union all
select 'tags.name', id::text, char_length(name)
from public.tags
where char_length(btrim(name)) not between 1 and 40
union all
select 'tones.name', id::text, char_length(name)
from public.tones
where char_length(btrim(name)) not between 1 and 40
union all
select 'videos.title', id::text, char_length(title)
from public.videos
where char_length(btrim(title)) not between 1 and 200
union all
select 'videos.description', id::text, char_length(description)
from public.videos
where description is not null and char_length(description) > 5000
union all
select 'videos.author_name', id::text, char_length(author_name)
from public.videos
where author_name is not null
  and char_length(btrim(author_name)) not between 1 and 100
union all
select 'submissions.source_url', id::text, char_length(source_url)
from public.submissions
where source_url is not null and char_length(source_url) > 2048
union all
select 'submissions.source_ref', id::text, char_length(source_ref)
from public.submissions
where source_ref is not null and char_length(source_ref) > 2048
union all
select 'submissions.cover_ref', id::text, char_length(cover_ref)
from public.submissions
where cover_ref is not null and char_length(cover_ref) > 2048
union all
select 'submissions.review_note', id::text, char_length(review_note)
from public.submissions
where review_note is not null and char_length(review_note) > 1000
order by field, length desc;
