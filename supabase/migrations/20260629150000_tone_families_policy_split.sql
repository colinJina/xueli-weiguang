drop policy if exists tone_families_admin_all on public.tone_families;

do $$
declare
  admin_check text := 'exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)';
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tone_families'
      and policyname = 'tone_families_admin_insert'
  ) then
    execute 'create policy tone_families_admin_insert on public.tone_families for insert to authenticated with check (' || admin_check || ')';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tone_families'
      and policyname = 'tone_families_admin_update'
  ) then
    execute 'create policy tone_families_admin_update on public.tone_families for update to authenticated using (' || admin_check || ') with check (' || admin_check || ')';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tone_families'
      and policyname = 'tone_families_admin_delete'
  ) then
    execute 'create policy tone_families_admin_delete on public.tone_families for delete to authenticated using (' || admin_check || ')';
  end if;
end $$;
