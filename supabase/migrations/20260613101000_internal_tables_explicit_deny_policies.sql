-- Internal service-role tables should remain inaccessible to direct clients.
-- Explicit deny policies keep RLS posture clear for database linting and future grants.

create policy native_upload_sessions_deny_client_all
  on public.native_upload_sessions
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy video_view_daily_buckets_deny_client_all
  on public.video_view_daily_buckets
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);
