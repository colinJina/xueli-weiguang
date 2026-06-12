begin;

create table public.home_hero_feature_requests (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'applied', 'rejected')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.home_hero_features (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  source_submission_id uuid references public.submissions(id) on delete set null,
  focal_x numeric not null default 0.5 check (focal_x >= 0 and focal_x <= 1),
  focal_y numeric not null default 0.5 check (focal_y >= 0 and focal_y <= 1),
  overlay_strength numeric not null default 0.62 check (
    overlay_strength >= 0.4 and overlay_strength <= 0.8
  ),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index idx_home_hero_features_single_active
  on public.home_hero_features (is_active)
  where is_active;

create index idx_home_hero_features_video_id
  on public.home_hero_features (video_id);

create index idx_home_hero_features_active_created_at
  on public.home_hero_features (is_active, created_at desc);

create index idx_home_hero_feature_requests_status_created_at
  on public.home_hero_feature_requests (status, created_at desc);

create or replace function public.get_home_site_stats()
returns table (
  published_video_count bigint,
  published_category_count bigint,
  latest_published_at timestamptz
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    count(videos.id)::bigint as published_video_count,
    count(distinct videos.category_id)::bigint as published_category_count,
    max(videos.published_at) as latest_published_at
  from public.videos
  where videos.published_at is not null;
$$;

alter table public.home_hero_feature_requests enable row level security;
alter table public.home_hero_features enable row level security;

create policy "home_hero_features_public_read_active_published"
on public.home_hero_features
for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.videos
    where videos.id = home_hero_features.video_id
      and videos.published_at is not null
  )
);

revoke all on table public.home_hero_feature_requests from anon, authenticated;
revoke all on table public.home_hero_features from anon, authenticated;

grant select on table public.home_hero_features to anon, authenticated;

grant select, insert, update, delete on table public.home_hero_feature_requests to service_role;
grant select, insert, update, delete on table public.home_hero_features to service_role;

revoke all on function public.get_home_site_stats() from public;
revoke all on function public.get_home_site_stats() from anon;
revoke all on function public.get_home_site_stats() from authenticated;
grant execute on function public.get_home_site_stats() to anon, authenticated;

commit;
