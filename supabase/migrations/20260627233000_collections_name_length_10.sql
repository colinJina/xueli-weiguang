begin;

alter table public.collections
  drop constraint if exists collections_name_length;

alter table public.collections
  add constraint collections_name_length
  check (char_length(btrim(name)) between 1 and 10) not valid;

commit;
