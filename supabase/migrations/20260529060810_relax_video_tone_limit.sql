begin;

drop trigger if exists videos_require_exactly_three_tones on public.videos;
drop trigger if exists video_tones_require_exactly_three_tones on public.video_tones;

drop function if exists private.enforce_video_tone_count_from_videos();
drop function if exists private.enforce_video_tone_count_from_video_tones();
drop function if exists private.assert_video_has_exactly_three_tones(uuid);

commit;
