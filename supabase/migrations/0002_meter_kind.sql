-- Migration 0002: Zählerart als Feld `kind` (consumption | feed_in | info).
-- Ersetzt das bisherige Boolean is_feed_in. Für bestehende Datenbanken ausführen.
-- (Frische Einrichtung über schema.sql benötigt diese Migration nicht.)

alter table public.meters
  add column if not exists kind text not null default 'consumption'
  check (kind in ('consumption', 'feed_in', 'info'));

-- Bestehende Einspeisezähler übernehmen und altes Flag entfernen (idempotent).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'meters' and column_name = 'is_feed_in'
  ) then
    update public.meters set kind = 'feed_in' where is_feed_in is true and kind = 'consumption';
    alter table public.meters drop column is_feed_in;
  end if;
end $$;
