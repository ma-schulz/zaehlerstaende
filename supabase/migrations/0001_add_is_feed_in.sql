-- Migration 0001: Einspeisezähler-Flag ergänzen.
-- Für bereits bestehende Datenbanken im Supabase-SQL-Editor ausführen.
-- (Bei einer frischen Einrichtung über schema.sql nicht nötig – die Spalte
--  ist dort bereits Teil der meters-Tabelle. Das Statement ist idempotent.)

alter table public.meters
  add column if not exists is_feed_in boolean not null default false;
