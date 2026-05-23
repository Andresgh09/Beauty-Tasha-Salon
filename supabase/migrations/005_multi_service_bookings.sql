-- =====================================================================
-- Beauty Tasha Salón — Migration 005: Multi-Service Bookings
-- =====================================================================
-- COPIAR Y PEGAR EN: Supabase Dashboard → SQL Editor → New Query → Run
-- =====================================================================
-- Permite que una cita tenga múltiples servicios.
-- Las columnas existentes en bookings (service_id, service_name, etc)
-- se mantienen como "servicio principal" para compatibilidad.
-- =====================================================================

-- 1) Nueva tabla booking_items
create table if not exists booking_items (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  -- Snapshots (sobreviven aunque se borre el servicio del catálogo)
  service_name text not null,
  service_price integer not null check (service_price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  position smallint not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_booking_items_booking on booking_items(booking_id);
create index if not exists idx_booking_items_service on booking_items(service_id);

comment on table booking_items is 'Items (servicios) que componen una cita. Una cita puede tener N items.';

-- 2) RLS — público puede crear (al reservar), admin lee/edita todo
alter table booking_items enable row level security;

create policy "public can create booking items"
  on booking_items for insert
  with check (true);

create policy "admin can read all booking items"
  on booking_items for select
  to authenticated
  using (true);

create policy "admin can update booking items"
  on booking_items for update
  to authenticated
  using (true) with check (true);

create policy "admin can delete booking items"
  on booking_items for delete
  to authenticated
  using (true);

-- 3) GRANTs (los nuevos en public schema, por las dudas)
grant all privileges on booking_items to anon, authenticated, service_role;

-- 4) Backfill: crear 1 item por cada booking existente
-- usando los snapshots que ya tiene la tabla bookings
insert into booking_items (booking_id, service_id, service_name, service_price, duration_minutes, position)
select id, service_id, service_name, service_price, duration_minutes, 0
from bookings
where not exists (
  select 1 from booking_items where booking_id = bookings.id
);

-- 5) Verificación: muestra cuántos items se crearon
select
  count(*) as total_items,
  count(distinct booking_id) as bookings_con_items
from booking_items;

-- 6) Verificación: muestra estructura de la nueva tabla
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_name = 'booking_items'
order by ordinal_position;
