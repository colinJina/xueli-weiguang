begin;

alter table public.profiles
  drop constraint if exists profiles_username_handle_length;

alter table public.profiles
  add constraint profiles_username_handle_length
  check (
    username is null
    or (
      char_length(btrim(username)) between 1 and 30
      and btrim(username) ~ '^[A-Za-z0-9_.-]+$'
    )
  ) not valid;

alter table public.categories
  drop constraint if exists categories_name_length;

alter table public.categories
  add constraint categories_name_length
  check (char_length(btrim(name)) between 1 and 40) not valid;

alter table public.tags
  drop constraint if exists tags_name_length;

alter table public.tags
  add constraint tags_name_length
  check (char_length(btrim(name)) between 1 and 40) not valid;

alter table public.tones
  drop constraint if exists tones_name_length;

alter table public.tones
  add constraint tones_name_length
  check (char_length(btrim(name)) between 1 and 40) not valid;

alter table public.videos
  drop constraint if exists videos_title_length,
  drop constraint if exists videos_description_length,
  drop constraint if exists videos_author_name_length;

alter table public.videos
  add constraint videos_title_length
    check (char_length(btrim(title)) between 1 and 200) not valid,
  add constraint videos_description_length
    check (description is null or char_length(description) <= 5000) not valid,
  add constraint videos_author_name_length
    check (author_name is null or char_length(btrim(author_name)) between 1 and 100) not valid;

alter table public.submissions
  drop constraint if exists submissions_source_url_length,
  drop constraint if exists submissions_source_ref_length,
  drop constraint if exists submissions_cover_ref_length,
  drop constraint if exists submissions_review_note_length;

alter table public.submissions
  add constraint submissions_source_url_length
    check (source_url is null or char_length(source_url) <= 2048) not valid,
  add constraint submissions_source_ref_length
    check (source_ref is null or char_length(source_ref) <= 2048) not valid,
  add constraint submissions_cover_ref_length
    check (cover_ref is null or char_length(cover_ref) <= 2048) not valid,
  add constraint submissions_review_note_length
    check (review_note is null or char_length(review_note) <= 1000) not valid;

commit;
