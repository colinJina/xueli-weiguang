create index if not exists idx_home_hero_feature_requests_created_by
  on public.home_hero_feature_requests (created_by);

create index if not exists idx_home_hero_features_created_by
  on public.home_hero_features (created_by);

create index if not exists idx_home_hero_features_source_submission_id
  on public.home_hero_features (source_submission_id);
