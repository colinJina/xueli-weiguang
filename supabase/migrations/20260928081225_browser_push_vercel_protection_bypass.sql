begin;

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
  vercel_bypass_secret text;
  request_headers jsonb;
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

  select secrets.decrypted_secret
  into vercel_bypass_secret
  from vault.decrypted_secrets as secrets
  where secrets.name = 'browser_push_vercel_bypass_secret'
  limit 1;

  request_headers := pg_catalog.jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || dispatch_secret
  );

  if nullif(pg_catalog.btrim(vercel_bypass_secret), '') is not null then
    request_headers := request_headers || pg_catalog.jsonb_build_object(
      'x-vercel-protection-bypass', vercel_bypass_secret
    );
  end if;

  return net.http_post(
    url := dispatch_url,
    body := pg_catalog.jsonb_build_object('source', 'supabase-cron'),
    headers := request_headers,
    timeout_milliseconds := 10000
  );
end;
$$;

revoke all on function private.invoke_browser_push_dispatch()
  from public, anon, authenticated, service_role;
grant execute on function private.invoke_browser_push_dispatch() to postgres;

commit;
