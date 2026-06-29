create table if not exists public.tone_families (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null unique,
  color_hex text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint tone_families_key_format check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint tone_families_name_length check (char_length(btrim(name)) between 1 and 20),
  constraint tone_families_color_hex_format check (color_hex ~ '^#[0-9A-F]{6}$')
);

insert into public.tone_families (key, name, color_hex, sort_order, is_active)
values
  ('red', '红', '#EF4444', 10, true),
  ('orange', '橙', '#F97316', 20, true),
  ('yellow', '黄', '#EAB308', 30, true),
  ('green', '绿', '#22C55E', 40, true),
  ('cyan', '青', '#06B6D4', 50, true),
  ('blue', '蓝', '#3B82F6', 60, true),
  ('purple', '紫', '#8B5CF6', 70, true),
  ('pink', '粉', '#EC4899', 80, true),
  ('brown', '棕', '#92400E', 90, true),
  ('neutral', '中性', '#737373', 100, true)
on conflict (key) do update
set
  name = excluded.name,
  color_hex = excluded.color_hex,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

alter table public.tones
  add column if not exists family_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tones_family_id_fkey'
      and conrelid = 'public.tones'::regclass
  ) then
    alter table public.tones
      add constraint tones_family_id_fkey
      foreign key (family_id)
      references public.tone_families(id)
      on delete restrict;
  end if;
end $$;

update public.tones
set color_hex = upper(color_hex)
where color_hex is not null;

update public.tones
set family_id = family.id
from public.tone_families family
where tones.family_id is null
  and family.key = case upper(tones.color_hex)
    when '#2F2D32' then 'neutral'
    when '#CAC5BB' then 'neutral'
    when '#629B9D' then 'cyan'
    when '#8F3838' then 'red'
    when '#D9949F' then 'pink'
    when '#F887B3' then 'pink'
    when '#F4E0C9' then 'orange'
    else 'neutral'
  end;

alter table public.tones
  alter column family_id set not null;

create index if not exists idx_tones_family_id_id
on public.tones(family_id, id);

alter table public.tone_families enable row level security;

do $$
declare
  admin_check text := 'exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)';
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tone_families'
      and policyname = 'tone_families_public_read'
  ) then
    execute $policy$
      create policy tone_families_public_read
      on public.tone_families
      for select
      to anon, authenticated
      using (true)
    $policy$;
  end if;

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

revoke all on public.tone_families from anon, authenticated;
grant select on public.tone_families to anon, authenticated;
grant insert, update, delete on public.tone_families to authenticated;
