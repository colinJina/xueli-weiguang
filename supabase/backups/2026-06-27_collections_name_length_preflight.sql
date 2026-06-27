-- Run before validating 20260627233000_collections_name_length_10.sql.
-- Any returned row must be reviewed and cleaned up before running VALIDATE CONSTRAINT.

select
  'collections.name' as field,
  id::text as row_id,
  char_length(name) as length,
  name
from public.collections
where char_length(btrim(name)) not between 1 and 10
order by length desc, row_id;
