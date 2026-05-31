begin;

alter table public.submissions
  add column if not exists fetched_at timestamptz,
  add column if not exists fetch_error text;

commit;
