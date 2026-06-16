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
  -- leitungsgebunden (Strom/Wasser): Kosten über Tarif. Sonst (Pellets o.ä.): Zukäufe + FIFO.
  line_bound    boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Zukäufe für nicht leitungsgebundene Zähler (z.B. Pellets): Menge + bezahlter Gesamtpreis.
create table if not exists public.purchases (
  id           uuid primary key default gen_random_uuid(),
  meter_id     uuid not null references public.meters (id) on delete cascade,
  quantity     numeric not null check (quantity > 0),
  total_price  numeric not null default 0,
  purchased_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists purchases_meter_id_idx on public.purchases (meter_id, purchased_at);

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

alter table public.meters    enable row level security;
alter table public.readings  enable row level security;
alter table public.purchases enable row level security;

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

-- purchases: Zugriff nur, wenn der zugehörige meter dem User gehört
drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own" on public.purchases
  for select using (
    exists (select 1 from public.meters m where m.id = purchases.meter_id and m.user_id = auth.uid())
  );

drop policy if exists "purchases_insert_own" on public.purchases;
create policy "purchases_insert_own" on public.purchases
  for insert with check (
    exists (select 1 from public.meters m where m.id = purchases.meter_id and m.user_id = auth.uid())
  );

drop policy if exists "purchases_update_own" on public.purchases;
create policy "purchases_update_own" on public.purchases
  for update using (
    exists (select 1 from public.meters m where m.id = purchases.meter_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.meters m where m.id = purchases.meter_id and m.user_id = auth.uid())
  );

drop policy if exists "purchases_delete_own" on public.purchases;
create policy "purchases_delete_own" on public.purchases
  for delete using (
    exists (select 1 from public.meters m where m.id = purchases.meter_id and m.user_id = auth.uid())
  );
