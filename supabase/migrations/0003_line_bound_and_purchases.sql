-- Migration 0003: leitungsgebunden-Flag + Zukäufe (FIFO) für bestehende Datenbanken.
-- (Frische Einrichtung über schema.sql benötigt diese Migration nicht.)

alter table public.meters
  add column if not exists line_bound boolean not null default true;

create table if not exists public.purchases (
  id           uuid primary key default gen_random_uuid(),
  meter_id     uuid not null references public.meters (id) on delete cascade,
  quantity     numeric not null check (quantity > 0),
  total_price  numeric not null default 0,
  purchased_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists purchases_meter_id_idx on public.purchases (meter_id, purchased_at);

alter table public.purchases enable row level security;

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
