begin;

-- These operational tables are service-role only. Separate policies per
-- operation keep the denied client surface explicit even if a future grant is
-- added accidentally.

create policy push_subscriptions_deny_client_select
  on public.push_subscriptions
  as restrictive
  for select
  to anon, authenticated
  using (false);

create policy push_subscriptions_deny_client_insert
  on public.push_subscriptions
  as restrictive
  for insert
  to anon, authenticated
  with check (false);

create policy push_subscriptions_deny_client_update
  on public.push_subscriptions
  as restrictive
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy push_subscriptions_deny_client_delete
  on public.push_subscriptions
  as restrictive
  for delete
  to anon, authenticated
  using (false);

create policy push_broadcasts_deny_client_select
  on public.push_broadcasts
  as restrictive
  for select
  to anon, authenticated
  using (false);

create policy push_broadcasts_deny_client_insert
  on public.push_broadcasts
  as restrictive
  for insert
  to anon, authenticated
  with check (false);

create policy push_broadcasts_deny_client_update
  on public.push_broadcasts
  as restrictive
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy push_broadcasts_deny_client_delete
  on public.push_broadcasts
  as restrictive
  for delete
  to anon, authenticated
  using (false);

create policy push_deliveries_deny_client_select
  on public.push_deliveries
  as restrictive
  for select
  to anon, authenticated
  using (false);

create policy push_deliveries_deny_client_insert
  on public.push_deliveries
  as restrictive
  for insert
  to anon, authenticated
  with check (false);

create policy push_deliveries_deny_client_update
  on public.push_deliveries
  as restrictive
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy push_deliveries_deny_client_delete
  on public.push_deliveries
  as restrictive
  for delete
  to anon, authenticated
  using (false);

commit;
