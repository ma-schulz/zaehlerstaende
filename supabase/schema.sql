-- Zählerstand-App: Datenbank-Schema + Row Level Security
-- Einmalig im Supabase SQL-Editor ausführen.

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

create table if not exists public.meters (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name          text not null,
  unit          text not null,
  icon          text not null default 'gauge',
  decimals      integer not null default 2 check (decimals >= 0 and decimals <= 6),
  cost_per_unit numeric not null default 0,
  -- Zählerart: consumption = Verbrauch/Kosten, feed_in = Einspeisung/Ertrag, info = nur Info (keine Kosten)
  kind          text not null default 'consumption' check (kind in ('consumption', 'feed_in', 'info')),
  created_at    timestamptz not null default now()
);

create table if not exists public.readings (
  id          uuid primary key default gen_random_uuid(),
  meter_id    uuid not null references public.meters (id) on delete cascade,
  value       numeric not null,
  reading_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists readings_meter_id_idx on public.readings (meter_id, reading_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.meters   enable row level security;
alter table public.readings enable row level security;

-- meters: jeder User nur eigene Zähler
drop policy if exists "meters_select_own" on public.meters;
create policy "meters_select_own" on public.meters
  for select using (auth.uid() = user_id);

drop policy if exists "meters_insert_own" on public.meters;
create policy "meters_insert_own" on public.meters
  for insert with check (auth.uid() = user_id);

drop policy if exists "meters_update_own" on public.meters;
create policy "meters_update_own" on public.meters
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "meters_delete_own" on public.meters;
create policy "meters_delete_own" on public.meters
  for delete using (auth.uid() = user_id);

-- readings: Zugriff nur, wenn der zugehörige meter dem User gehört
drop policy if exists "readings_select_own" on public.readings;
create policy "readings_select_own" on public.readings
  for select using (
    exists (select 1 from public.meters m where m.id = readings.meter_id and m.user_id = auth.uid())
  );

drop policy if exists "readings_insert_own" on public.readings;
create policy "readings_insert_own" on public.readings
  for insert with check (
    exists (select 1 from public.meters m where m.id = readings.meter_id and m.user_id = auth.uid())
  );

drop policy if exists "readings_update_own" on public.readings;
create policy "readings_update_own" on public.readings
  for update using (
    exists (select 1 from public.meters m where m.id = readings.meter_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.meters m where m.id = readings.meter_id and m.user_id = auth.uid())
  );

drop policy if exists "readings_delete_own" on public.readings;
create policy "readings_delete_own" on public.readings
  for delete using (
    exists (select 1 from public.meters m where m.id = readings.meter_id and m.user_id = auth.uid())
  );
