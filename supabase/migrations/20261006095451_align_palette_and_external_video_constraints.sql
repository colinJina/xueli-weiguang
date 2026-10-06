-- Align historical drift with the existing HEX and external-video invariants.
-- No business rows are copied, updated or deleted by this migration.
begin;

alter table public.tones alter column color_hex set not null;

alter table public.videos
  drop constraint if exists videos_external_source_check,
  add constraint videos_external_source_check
    check (
      storage_provider not in ('bilibili', 'youtube')
      or (
        platform = storage_provider
        and nullif(trim(coalesce(source_url, '')), '') is not null
        and nullif(trim(coalesce(embed_url, '')), '') is not null
      )
    );

commit;
