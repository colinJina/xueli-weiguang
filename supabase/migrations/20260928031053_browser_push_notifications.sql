begin;

create schema if not exists private;

-- The earlier view-count migration granted cron privileges while running as
-- postgres. Those redundant self-grants depend on Supabase's grant options and
-- prevent the platform extension event trigger from normalizing permissions
-- when pg_net is enabled. Remove only grants issued by postgres; grants issued
-- by supabase_admin remain intact.
revoke all privileges on schema cron
  from postgres granted by postgres;
revoke all privileges on all tables in schema cron
  from postgres granted by postgres;
revoke all privileges on all sequences in schema cron
  from postgres granted by postgres;
revoke all privileges on all functions in schema cron
  from postgres granted by postgres;

create extension if not exists pg_net;
create extension if not exists pg_cron with schema pg_catalog;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  expiration_time bigint,
  status text not null default 'active',
  consecutive_failure_count integer not null default 0,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_unique unique (endpoint),
  constraint push_subscriptions_endpoint_check check (
    char_length(endpoint) between 1 and 2048
    and endpoint ~ '^https://'
  ),
  constraint push_subscriptions_p256dh_check check (
    char_length(p256dh) between 40 and 256
    and p256dh ~ '^[A-Za-z0-9_-]+$'
  ),
  constraint push_subscriptions_auth_check check (
    char_length(auth) between 8 and 128
    and auth ~ '^[A-Za-z0-9_-]+$'
  ),
  constraint push_subscriptions_expiration_time_check check (
    expiration_time is null or expiration_time >= 0
  ),
  constraint push_subscriptions_status_check check (
    status in ('active', 'revoked')
  ),
  constraint push_subscriptions_failure_count_check check (
    consecutive_failure_count >= 0
  ),
  constraint push_subscriptions_revocation_state_check check (
    (status = 'active' and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
  )
);

create table public.push_broadcasts (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  title_snapshot text not null,
  body_snapshot text not null,
  target_url text not null,
  status text not null default 'pending',
  expanded_at timestamptz,
  total_count integer not null default 0,
  sent_count integer not null default 0,
  dead_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint push_broadcasts_video_id_unique unique (video_id),
  constraint push_broadcasts_title_snapshot_check check (
    char_length(btrim(title_snapshot)) between 1 and 160
  ),
  constraint push_broadcasts_body_snapshot_check check (
    char_length(btrim(body_snapshot)) between 1 and 300
  ),
  constraint push_broadcasts_target_url_check check (
    target_url = '/video/' || video_id::text
  ),
  constraint push_broadcasts_status_check check (
    status in ('pending', 'expanding', 'sending', 'completed', 'partial', 'cancelled')
  ),
  constraint push_broadcasts_counts_check check (
    total_count >= 0
    and sent_count >= 0
    and dead_count >= 0
    and sent_count + dead_count <= total_count
  ),
  constraint push_broadcasts_lease_state_check check (
    (lease_token is null and lease_expires_at is null)
    or (lease_token is not null and lease_expires_at is not null)
  )
);

create table public.push_deliveries (
  broadcast_id uuid not null references public.push_broadcasts(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_expires_at timestamptz,
  last_status_code integer,
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (broadcast_id, subscription_id),
  constraint push_deliveries_status_check check (
    status in ('pending', 'processing', 'retry', 'sent', 'dead')
  ),
  constraint push_deliveries_attempt_count_check check (attempt_count >= 0),
  constraint push_deliveries_status_code_check check (
    last_status_code is null or last_status_code between 100 and 599
  ),
  constraint push_deliveries_error_code_check check (
    last_error_code is null or char_length(last_error_code) <= 80
  ),
  constraint push_deliveries_lease_state_check check (
    (status = 'processing' and lease_token is not null and lease_expires_at is not null)
    or (status <> 'processing' and lease_token is null and lease_expires_at is null)
  ),
  constraint push_deliveries_sent_state_check check (
    (status = 'sent' and sent_at is not null)
    or (status <> 'sent' and sent_at is null)
  )
);

create index idx_push_subscriptions_active_created_at
  on public.push_subscriptions (created_at, id)
  where status = 'active';

create index idx_push_subscriptions_revoked_at
  on public.push_subscriptions (revoked_at)
  where status = 'revoked';

create index idx_push_broadcasts_pending
  on public.push_broadcasts (next_attempt_at, created_at)
  where status in ('pending', 'expanding', 'sending');

create index idx_push_broadcasts_terminal_completed_at
  on public.push_broadcasts (completed_at)
  where status in ('completed', 'partial', 'cancelled');

create index idx_push_deliveries_claimable
  on public.push_deliveries (next_attempt_at, broadcast_id)
  where status in ('pending', 'retry', 'processing');

create index idx_push_deliveries_subscription_id
  on public.push_deliveries (subscription_id);

create index idx_push_deliveries_broadcast_status
  on public.push_deliveries (broadcast_id, status);

alter table public.push_subscriptions enable row level security;
alter table public.push_broadcasts enable row level security;
alter table public.push_deliveries enable row level security;

revoke all on table public.push_subscriptions from public, anon, authenticated;
revoke all on table public.push_broadcasts from public, anon, authenticated;
revoke all on table public.push_deliveries from public, anon, authenticated;

grant select, insert, update, delete on table public.push_subscriptions to service_role;
grant select, insert, update, delete on table public.push_broadcasts to service_role;
grant select, insert, update, delete on table public.push_deliveries to service_role;

create or replace function private.touch_push_subscription_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;

create trigger touch_push_subscription_updated_at
before update on public.push_subscriptions
for each row
execute function private.touch_push_subscription_updated_at();

create or replace function private.enqueue_video_publish_broadcast()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  snapshot_title text;
begin
  if new.published_at is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.published_at is not null then
    return new;
  end if;

  snapshot_title := left(
    coalesce(nullif(pg_catalog.btrim(new.title), ''), '未命名作品'),
    160
  );

  insert into public.push_broadcasts (
    video_id,
    title_snapshot,
    body_snapshot,
    target_url
  )
  values (
    new.id,
    snapshot_title,
    left(pg_catalog.format('《%s》现已公开，点击查看', snapshot_title), 300),
    '/video/' || new.id::text
  )
  on conflict (video_id) do nothing;

  return new;
end;
$$;

revoke all on function private.enqueue_video_publish_broadcast()
  from public, anon, authenticated, service_role;

create trigger enqueue_video_publish_broadcast
after insert or update of published_at on public.videos
for each row
execute function private.enqueue_video_publish_broadcast();

create or replace function private.finish_revoked_push_deliveries()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'revoked' and old.status is distinct from 'revoked' then
    update public.push_deliveries
    set
      status = 'dead',
      lease_token = null,
      lease_expires_at = null,
      last_error_code = 'subscription_revoked',
      sent_at = null
    where subscription_id = new.id
      and status in ('pending', 'processing', 'retry');
  end if;

  return new;
end;
$$;

revoke all on function private.finish_revoked_push_deliveries()
  from public, anon, authenticated, service_role;

create trigger finish_revoked_push_deliveries
after update of status on public.push_subscriptions
for each row
execute function private.finish_revoked_push_deliveries();

create or replace function public.claim_push_broadcasts(
  p_limit integer,
  p_lease_token uuid,
  p_lease_seconds integer default 120
)
returns table (
  id uuid,
  video_id uuid,
  title_snapshot text,
  body_snapshot text,
  target_url text,
  expanded_at timestamptz,
  created_at timestamptz
)
language sql
volatile
security invoker
set search_path = ''
as $$
  with candidates as (
    select broadcasts.id
    from public.push_broadcasts as broadcasts
    where broadcasts.status in ('pending', 'expanding', 'sending')
      and broadcasts.next_attempt_at <= statement_timestamp()
      and (
        broadcasts.lease_expires_at is null
        or broadcasts.lease_expires_at <= statement_timestamp()
      )
    order by broadcasts.next_attempt_at, broadcasts.created_at
    limit least(greatest(coalesce(p_limit, 1), 1), 5)
    for update skip locked
  ),
  claimed as (
    update public.push_broadcasts as broadcasts
    set
      status = case
        when broadcasts.expanded_at is null then 'expanding'
        else 'sending'
      end,
      lease_token = p_lease_token,
      lease_expires_at = statement_timestamp()
        + pg_catalog.make_interval(secs => least(greatest(coalesce(p_lease_seconds, 120), 30), 600))
    from candidates
    where broadcasts.id = candidates.id
    returning
      broadcasts.id,
      broadcasts.video_id,
      broadcasts.title_snapshot,
      broadcasts.body_snapshot,
      broadcasts.target_url,
      broadcasts.expanded_at,
      broadcasts.created_at
  )
  select * from claimed;
$$;

create or replace function public.expand_push_broadcast(
  p_broadcast_id uuid,
  p_lease_token uuid
)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  broadcast_created_at timestamptz;
  delivery_count integer;
begin
  select broadcasts.created_at
  into broadcast_created_at
  from public.push_broadcasts as broadcasts
  where broadcasts.id = p_broadcast_id
    and broadcasts.lease_token = p_lease_token
    and broadcasts.lease_expires_at > statement_timestamp()
  for update;

  if not found then
    raise exception 'push_broadcast_lease_invalid' using errcode = '42501';
  end if;

  insert into public.push_deliveries (broadcast_id, subscription_id)
  select p_broadcast_id, subscriptions.id
  from public.push_subscriptions as subscriptions
  where subscriptions.status = 'active'
    and subscriptions.created_at <= broadcast_created_at
  on conflict (broadcast_id, subscription_id) do nothing;

  select count(*)::integer
  into delivery_count
  from public.push_deliveries as deliveries
  where deliveries.broadcast_id = p_broadcast_id;

  update public.push_broadcasts
  set
    expanded_at = coalesce(expanded_at, statement_timestamp()),
    total_count = delivery_count,
    status = 'sending',
    next_attempt_at = statement_timestamp()
  where id = p_broadcast_id;

  return delivery_count;
end;
$$;

create or replace function public.claim_push_deliveries(
  p_broadcast_id uuid,
  p_lease_token uuid,
  p_batch_size integer default 100,
  p_lease_seconds integer default 120
)
returns table (
  broadcast_id uuid,
  subscription_id uuid,
  endpoint text,
  p256dh text,
  auth text,
  expiration_time bigint,
  attempt_count integer
)
language sql
volatile
security invoker
set search_path = ''
as $$
  with valid_broadcast as (
    select broadcasts.id
    from public.push_broadcasts as broadcasts
    where broadcasts.id = p_broadcast_id
      and broadcasts.lease_token = p_lease_token
      and broadcasts.lease_expires_at > statement_timestamp()
  ),
  candidates as (
    select deliveries.broadcast_id, deliveries.subscription_id
    from public.push_deliveries as deliveries
    join public.push_subscriptions as subscriptions
      on subscriptions.id = deliveries.subscription_id
     and subscriptions.status = 'active'
    join valid_broadcast on valid_broadcast.id = deliveries.broadcast_id
    where deliveries.status in ('pending', 'retry', 'processing')
      and deliveries.next_attempt_at <= statement_timestamp()
      and (
        deliveries.status <> 'processing'
        or deliveries.lease_expires_at <= statement_timestamp()
      )
    order by deliveries.next_attempt_at, deliveries.created_at
    limit least(greatest(coalesce(p_batch_size, 100), 1), 100)
    for update of deliveries skip locked
  ),
  claimed as (
    update public.push_deliveries as deliveries
    set
      status = 'processing',
      attempt_count = deliveries.attempt_count + 1,
      lease_token = p_lease_token,
      lease_expires_at = statement_timestamp()
        + pg_catalog.make_interval(secs => least(greatest(coalesce(p_lease_seconds, 120), 30), 600)),
      last_status_code = null,
      last_error_code = null,
      sent_at = null
    from candidates
    where deliveries.broadcast_id = candidates.broadcast_id
      and deliveries.subscription_id = candidates.subscription_id
    returning
      deliveries.broadcast_id,
      deliveries.subscription_id,
      deliveries.attempt_count
  )
  select
    claimed.broadcast_id,
    claimed.subscription_id,
    subscriptions.endpoint,
    subscriptions.p256dh,
    subscriptions.auth,
    subscriptions.expiration_time,
    claimed.attempt_count
  from claimed
  join public.push_subscriptions as subscriptions
    on subscriptions.id = claimed.subscription_id;
$$;

create or replace function public.finish_push_delivery(
  p_broadcast_id uuid,
  p_subscription_id uuid,
  p_lease_token uuid,
  p_outcome text,
  p_status_code integer default null,
  p_error_code text default null,
  p_retry_after_seconds integer default 60,
  p_revoke_subscription boolean default false
)
returns boolean
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  current_attempt_count integer;
  next_status text;
  bounded_retry_seconds integer;
begin
  if p_outcome not in ('sent', 'retry', 'dead') then
    raise exception 'invalid_push_delivery_outcome' using errcode = '22023';
  end if;

  if p_status_code is not null and (p_status_code < 100 or p_status_code > 599) then
    raise exception 'invalid_push_delivery_status_code' using errcode = '22023';
  end if;

  select deliveries.attempt_count
  into current_attempt_count
  from public.push_deliveries as deliveries
  where deliveries.broadcast_id = p_broadcast_id
    and deliveries.subscription_id = p_subscription_id
    and deliveries.status = 'processing'
    and deliveries.lease_token = p_lease_token
  for update;

  if not found then
    return false;
  end if;

  bounded_retry_seconds := least(greatest(coalesce(p_retry_after_seconds, 60), 60), 86400);
  next_status := case
    when p_outcome = 'retry' and current_attempt_count < 5 then 'retry'
    when p_outcome = 'retry' then 'dead'
    else p_outcome
  end;

  update public.push_deliveries
  set
    status = next_status,
    next_attempt_at = case
      when next_status = 'retry'
        then statement_timestamp() + pg_catalog.make_interval(secs => bounded_retry_seconds)
      else next_attempt_at
    end,
    lease_token = null,
    lease_expires_at = null,
    last_status_code = p_status_code,
    last_error_code = left(nullif(pg_catalog.btrim(coalesce(p_error_code, '')), ''), 80),
    sent_at = case when next_status = 'sent' then statement_timestamp() else null end
  where broadcast_id = p_broadcast_id
    and subscription_id = p_subscription_id;

  if next_status = 'sent' then
    update public.push_subscriptions
    set
      consecutive_failure_count = 0,
      last_success_at = statement_timestamp()
    where id = p_subscription_id;
  else
    update public.push_subscriptions
    set
      consecutive_failure_count = consecutive_failure_count + 1,
      last_failure_at = statement_timestamp(),
      status = case when p_revoke_subscription then 'revoked' else status end,
      revoked_at = case
        when p_revoke_subscription then statement_timestamp()
        else revoked_at
      end
    where id = p_subscription_id;
  end if;

  return true;
end;
$$;

create or replace function public.finalize_push_broadcast(
  p_broadcast_id uuid,
  p_lease_token uuid
)
returns table (
  status text,
  total_count integer,
  sent_count integer,
  dead_count integer,
  remaining_count integer
)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  next_delivery_at timestamptz;
begin
  if not exists (
    select 1
    from public.push_broadcasts as broadcasts
    where broadcasts.id = p_broadcast_id
      and broadcasts.lease_token = p_lease_token
  ) then
    raise exception 'push_broadcast_lease_invalid' using errcode = '42501';
  end if;

  select
    count(*)::integer,
    count(*) filter (where deliveries.status = 'sent')::integer,
    count(*) filter (where deliveries.status = 'dead')::integer,
    count(*) filter (where deliveries.status in ('pending', 'processing', 'retry'))::integer,
    min(
      case
        when deliveries.status = 'processing' then deliveries.lease_expires_at
        when deliveries.status in ('pending', 'retry') then deliveries.next_attempt_at
        else null
      end
    )
  into total_count, sent_count, dead_count, remaining_count, next_delivery_at
  from public.push_deliveries as deliveries
  where deliveries.broadcast_id = p_broadcast_id;

  status := case
    when remaining_count > 0 then 'sending'
    when dead_count > 0 then 'partial'
    else 'completed'
  end;

  update public.push_broadcasts
  set
    status = finalize_push_broadcast.status,
    total_count = finalize_push_broadcast.total_count,
    sent_count = finalize_push_broadcast.sent_count,
    dead_count = finalize_push_broadcast.dead_count,
    next_attempt_at = coalesce(next_delivery_at, statement_timestamp()),
    lease_token = null,
    lease_expires_at = null,
    completed_at = case
      when finalize_push_broadcast.remaining_count = 0 then statement_timestamp()
      else null
    end
  where id = p_broadcast_id;

  return next;
end;
$$;

create or replace function public.cancel_push_broadcast(
  p_broadcast_id uuid,
  p_lease_token uuid,
  p_reason text default 'video_unpublished'
)
returns boolean
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  affected_broadcasts integer;
begin
  update public.push_deliveries
  set
    status = 'dead',
    lease_token = null,
    lease_expires_at = null,
    last_error_code = left(nullif(pg_catalog.btrim(coalesce(p_reason, '')), ''), 80),
    sent_at = null
  where broadcast_id = p_broadcast_id
    and status in ('pending', 'processing', 'retry');

  update public.push_broadcasts
  set
    status = 'cancelled',
    total_count = (
      select count(*)::integer
      from public.push_deliveries as deliveries
      where deliveries.broadcast_id = p_broadcast_id
    ),
    sent_count = (
      select count(*)::integer
      from public.push_deliveries as deliveries
      where deliveries.broadcast_id = p_broadcast_id
        and deliveries.status = 'sent'
    ),
    dead_count = (
      select count(*)::integer
      from public.push_deliveries as deliveries
      where deliveries.broadcast_id = p_broadcast_id
        and deliveries.status = 'dead'
    ),
    lease_token = null,
    lease_expires_at = null,
    completed_at = statement_timestamp()
  where id = p_broadcast_id
    and lease_token = p_lease_token;

  get diagnostics affected_broadcasts = row_count;
  return affected_broadcasts = 1;
end;
$$;

create or replace function public.cleanup_browser_push_data(
  p_revoked_before timestamptz,
  p_broadcast_before timestamptz,
  p_limit integer default 1000
)
returns table (
  deleted_subscription_count integer,
  deleted_broadcast_count integer
)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  with candidates as (
    select subscriptions.id
    from public.push_subscriptions as subscriptions
    where subscriptions.status = 'revoked'
      and subscriptions.revoked_at < p_revoked_before
    order by subscriptions.revoked_at
    limit least(greatest(coalesce(p_limit, 1000), 1), 10000)
    for update skip locked
  ),
  deleted as (
    delete from public.push_subscriptions as subscriptions
    using candidates
    where subscriptions.id = candidates.id
    returning subscriptions.id
  )
  select count(*)::integer into deleted_subscription_count from deleted;

  with candidates as (
    select broadcasts.id
    from public.push_broadcasts as broadcasts
    where broadcasts.status in ('completed', 'partial', 'cancelled')
      and broadcasts.completed_at < p_broadcast_before
    order by broadcasts.completed_at
    limit least(greatest(coalesce(p_limit, 1000), 1), 10000)
    for update skip locked
  ),
  deleted as (
    delete from public.push_broadcasts as broadcasts
    using candidates
    where broadcasts.id = candidates.id
    returning broadcasts.id
  )
  select count(*)::integer into deleted_broadcast_count from deleted;

  return next;
end;
$$;

revoke all on function public.claim_push_broadcasts(integer, uuid, integer)
  from public, anon, authenticated;
revoke all on function public.expand_push_broadcast(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.claim_push_deliveries(uuid, uuid, integer, integer)
  from public, anon, authenticated;
revoke all on function public.finish_push_delivery(uuid, uuid, uuid, text, integer, text, integer, boolean)
  from public, anon, authenticated;
revoke all on function public.finalize_push_broadcast(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.cancel_push_broadcast(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.cleanup_browser_push_data(timestamptz, timestamptz, integer)
  from public, anon, authenticated;

grant execute on function public.claim_push_broadcasts(integer, uuid, integer)
  to service_role;
grant execute on function public.expand_push_broadcast(uuid, uuid)
  to service_role;
grant execute on function public.claim_push_deliveries(uuid, uuid, integer, integer)
  to service_role;
grant execute on function public.finish_push_delivery(uuid, uuid, uuid, text, integer, text, integer, boolean)
  to service_role;
grant execute on function public.finalize_push_broadcast(uuid, uuid)
  to service_role;
grant execute on function public.cancel_push_broadcast(uuid, uuid, text)
  to service_role;
grant execute on function public.cleanup_browser_push_data(timestamptz, timestamptz, integer)
  to service_role;

create or replace function private.invoke_browser_push_dispatch()
returns bigint
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  dispatch_url text;
  dispatch_secret text;
begin
  select secrets.decrypted_secret
  into dispatch_url
  from vault.decrypted_secrets as secrets
  where secrets.name = 'browser_push_dispatch_url'
  limit 1;

  select secrets.decrypted_secret
  into dispatch_secret
  from vault.decrypted_secrets as secrets
  where secrets.name = 'browser_push_dispatch_secret'
  limit 1;

  if nullif(pg_catalog.btrim(dispatch_url), '') is null
    or nullif(pg_catalog.btrim(dispatch_secret), '') is null
  then
    return null;
  end if;

  return net.http_post(
    url := dispatch_url,
    body := pg_catalog.jsonb_build_object('source', 'supabase-cron'),
    headers := pg_catalog.jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || dispatch_secret
    ),
    timeout_milliseconds := 10000
  );
end;
$$;

revoke all on function private.invoke_browser_push_dispatch()
  from public, anon, authenticated, service_role;
grant usage on schema private to postgres;
grant execute on function private.invoke_browser_push_dispatch() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  for existing_job_id in
    select jobs.jobid
    from cron.job as jobs
    where jobs.jobname = 'dispatch-browser-push-every-minute'
  loop
    perform cron.unschedule(existing_job_id);
  end loop;

  perform cron.schedule(
    'dispatch-browser-push-every-minute',
    '* * * * *',
    $command$
      select private.invoke_browser_push_dispatch();
    $command$
  );
end;
$$;

commit;
