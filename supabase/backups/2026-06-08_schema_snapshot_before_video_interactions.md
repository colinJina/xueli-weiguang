# Supabase Schema Snapshot Before Video Interactions

Snapshot date: 2026-06-08
Project: `xueli-weiguang-bilibili-dev` (`imddodkuwdxmcrqpuesg`)
Scope: structure only, no table data.

This snapshot was collected with Supabase MCP before adding local COS video view and like interactions.

## Installed Extensions

- `pgcrypto` 1.3 in `extensions`
- `pg_stat_statements` 1.11 in `extensions`
- `plpgsql` 1.0 in `pg_catalog`
- `supabase_vault` 0.3.1 in `vault`
- `uuid-ossp` 1.1 in `extensions`

## Migrations Applied

- `20260529053602` - `bilibili_submission_foundation`
- `20260529054121` - `bilibili_submission_function_search_path_fix`
- `20260529060810` - `relax_video_tone_limit`
- `20260529063852` - `add_fk_covering_indexes`
- `20260529090952` - `submissions_add_fetch_state`
- `20260531134642` - `approve_submission_rpc`
- `20260607093000` - `add_fixed_tone_colors`
- `20260607153000` - `native_submission_storage_provider`

## Tables

### `public.profiles`

RLS: enabled

- `id uuid` primary key, references `auth.users(id)`
- `username text` nullable
- `is_admin boolean not null default false`
- `created_at timestamptz not null default now()`

Indexes:

- `profiles_pkey` unique btree `(id)`

Policies:

- `profiles_select_own` select to authenticated: current user id equals `id`
- `profiles_update_own` update to authenticated: current user id equals `id`

### `public.categories`

RLS: enabled

- `id uuid` primary key default `gen_random_uuid()`
- `name text` unique not null
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`

Indexes:

- `categories_pkey` unique btree `(id)`
- `categories_name_key` unique btree `(name)`

Policies:

- `categories_public_read` select to anon, authenticated: true
- `categories_admin_all` all to authenticated admins

### `public.tags`

RLS: enabled

- `id uuid` primary key default `gen_random_uuid()`
- `name text` unique not null
- `created_at timestamptz not null default now()`

Indexes:

- `tags_pkey` unique btree `(id)`
- `tags_name_key` unique btree `(name)`

Policies:

- `tags_public_read` select to anon, authenticated: true
- `tags_admin_all` all to authenticated admins

### `public.tones`

RLS: enabled

- `id uuid` primary key default `gen_random_uuid()`
- `name text` unique not null
- `created_at timestamptz not null default now()`
- `color_hex text default '#D4D4D4'`, check `color_hex is null or color_hex ~ '^#[0-9A-F]{6}$'`

Indexes:

- `tones_pkey` unique btree `(id)`
- `tones_name_key` unique btree `(name)`

Policies:

- `tones_public_read` select to anon, authenticated: true
- `tones_admin_all` all to authenticated admins

### `public.submissions`

RLS: enabled

- `id uuid` primary key default `gen_random_uuid()`
- `user_id uuid not null` references `public.profiles(id)`
- `platform text not null`, check `platform in ('bilibili', 'cos')`
- `source_url text`
- `external_id text not null`
- `status text not null default 'pending'`, check `status in ('pending', 'approved', 'rejected')`
- `auto_fetched_meta jsonb not null default '{}'::jsonb`
- `reviewed_by uuid` references `public.profiles(id)`
- `review_note text`
- `created_at timestamptz not null default now()`
- `reviewed_at timestamptz`
- `fetched_at timestamptz`
- `fetch_error text`
- `storage_provider text not null default 'bilibili'`, check `storage_provider in ('bilibili', 'cos')`
- `source_ref text`
- `cover_ref text`
- `pending_title text`
- `pending_description text`
- `file_size bigint`
- `mime_type text`
- `source_etag text`
- `cover_etag text`

Indexes:

- `submissions_pkey` unique btree `(id)`
- `submissions_platform_external_id_key` unique btree `(platform, external_id)`
- `idx_submissions_user_id` btree `(user_id)`
- `idx_submissions_reviewed_by` btree `(reviewed_by)`
- `idx_submissions_status_created_at` btree `(status, created_at desc)`
- `idx_submissions_storage_provider_source_ref_unique` unique btree `(storage_provider, source_ref)` where `source_ref is not null`
- `idx_submissions_storage_provider_status_created_at` btree `(storage_provider, status, created_at desc)`

Policies:

- `submissions_insert_own` insert to authenticated for own Bilibili submissions only
- `submissions_select_own` select to authenticated for own submissions
- `submissions_admin_select_all` select to authenticated admins
- `submissions_admin_update_all` update to authenticated admins

Triggers:

- `enforce_native_submission_pending_limit` before insert or update of `user_id`, `storage_provider`, `status`

### `public.videos`

RLS: enabled

- `id uuid` primary key default `gen_random_uuid()`
- `submission_id uuid not null unique` references `public.submissions(id)`
- `platform text not null`, check `platform in ('bilibili', 'cos')`
- `source_url text`
- `embed_url text`
- `title text not null`
- `cover_url text`
- `description text`
- `author_name text`
- `author_avatar text`
- `view_count bigint not null default 0`
- `like_count bigint not null default 0`
- `category_id uuid not null` references `public.categories(id)`
- `submitted_by uuid` references `public.profiles(id)`
- `published_at timestamptz`
- `created_at timestamptz not null default now()`
- `storage_provider text not null default 'bilibili'`, check `storage_provider in ('bilibili', 'cos')`
- `playback_ref text`

Indexes:

- `videos_pkey` unique btree `(id)`
- `videos_submission_id_key` unique btree `(submission_id)`
- `idx_videos_category_id` btree `(category_id)`
- `idx_videos_published_at` btree `(published_at desc)`
- `idx_videos_submitted_by` btree `(submitted_by)`
- `idx_videos_storage_provider_playback_ref_unique` unique btree `(storage_provider, playback_ref)` where `playback_ref is not null`
- `idx_videos_storage_provider_published_at` btree `(storage_provider, published_at desc)`

Policies:

- `videos_public_read_published` select to anon, authenticated where `published_at is not null`
- `videos_admin_all` all to authenticated admins

### `public.video_tags`

RLS: enabled

- `video_id uuid not null` references `public.videos(id)`
- `tag_id uuid not null` references `public.tags(id)`
- primary key `(video_id, tag_id)`

Indexes:

- `video_tags_pkey` unique btree `(video_id, tag_id)`
- `idx_video_tags_tag_id_video_id` btree `(tag_id, video_id)`

Policies:

- `video_tags_public_read_published_videos` select to anon, authenticated for published videos
- `video_tags_admin_all` all to authenticated admins

Triggers:

- `enforce_video_tag_limit` before insert or update of `video_id`

### `public.video_tones`

RLS: enabled

- `video_id uuid not null` references `public.videos(id)`
- `tone_id uuid not null` references `public.tones(id)`
- primary key `(video_id, tone_id)`

Indexes:

- `video_tones_pkey` unique btree `(video_id, tone_id)`
- `idx_video_tones_tone_id_video_id` btree `(tone_id, video_id)`

Policies:

- `video_tones_public_read_published_videos` select to anon, authenticated for published videos
- `video_tones_admin_all` all to authenticated admins

Triggers:

- `enforce_video_tone_max` before insert or update of `video_id`

## Functions

### `private`

- `private.handle_new_user()` returns trigger, security definer
- `private.enforce_video_tag_limit()` returns trigger
- `private.enforce_video_tone_max()` returns trigger
- `private.enforce_native_submission_pending_limit()` returns trigger

### `public`

- `public.approve_submission(p_submission_id uuid, p_category_id uuid, p_tag_ids uuid[], p_tone_ids uuid[], p_review_note text)` returns uuid, security invoker
- `public.approve_cos_submission(p_submission_id uuid, p_video_id uuid, p_category_id uuid, p_playback_ref text, p_cover_url text, p_tag_ids uuid[], p_tone_ids uuid[], p_review_note text)` returns uuid, security invoker

## Notes

- No `video_likes` or local view dedupe table existed at this snapshot.
- No anon/authenticated direct update policy existed on `public.videos`.
- Existing advisors before this feature included password leaked-protection warning and non-blocking performance lints for unused indexes and multiple permissive policies.
