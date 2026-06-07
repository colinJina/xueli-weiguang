alter table public.tones
add column if not exists color_hex text;

update public.tones
set color_hex = upper(color_hex)
where color_hex is not null;

alter table public.tones
drop constraint if exists tones_color_hex_format;

alter table public.tones
add constraint tones_color_hex_format
check (color_hex is null or color_hex ~ '^#[0-9A-F]{6}$');

insert into public.tones (name, color_hex)
values
  ('红', '#EF4444'),
  ('橙', '#F97316'),
  ('黄', '#EAB308'),
  ('绿', '#22C55E'),
  ('青', '#06B6D4'),
  ('蓝', '#3B82F6'),
  ('紫', '#8B5CF6')
on conflict (name) do update
set color_hex = excluded.color_hex;
