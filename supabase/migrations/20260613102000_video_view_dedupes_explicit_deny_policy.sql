-- video_view_dedupes is maintained through service-role video view RPC calls only.
-- Direct client access remains explicitly denied even if grants are changed later.

create policy video_view_dedupes_deny_client_all
  on public.video_view_dedupes
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);
