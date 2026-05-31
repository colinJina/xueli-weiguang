-- Add covering indexes for foreign keys flagged by Supabase performance advisor.
-- Without these, queries that filter or join on these FK columns degrade to
-- sequential scans once the tables grow. Most impactful: submissions.user_id,
-- which the public site will hit on every "my submissions" read.

create index if not exists idx_submissions_user_id
  on public.submissions (user_id);

create index if not exists idx_submissions_reviewed_by
  on public.submissions (reviewed_by);

create index if not exists idx_videos_submitted_by
  on public.videos (submitted_by);
