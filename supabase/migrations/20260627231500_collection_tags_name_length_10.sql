begin;

alter table public.collection_tags
  drop constraint if exists collection_tags_name_length;

alter table public.collection_tags
  add constraint collection_tags_name_length
  check (char_length(btrim(name)) between 1 and 10) not valid;

commit;
