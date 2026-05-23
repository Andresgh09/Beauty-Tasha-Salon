-- =====================================================================
-- Beauty Tasha Salón — Initial Schema
-- =====================================================================
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- =====================================================================
-- ENUMS
-- =====================================================================
create type service_category as enum (
  'manicure',
  'pedicure',
  'spa',
  'semipermanente',
  'extensiones',
  'ninas'
);

create type booking_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

create type discount_type as enum ('percentage', 'fixed');

-- =====================================================================
-- TABLE: services (catálogo de servicios)
-- =====================================================================
create table services (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  category service_category not null,
  price integer not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  short_description text not null,
  long_description text,
  images text[] default '{}',
  featured boolean default false,
  visible boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_services_visible on services(visible) where visible = true;
create index idx_services_category on services(category);

-- =====================================================================
-- TABLE: gallery (galería de diseños)
-- =====================================================================
create table gallery (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  alt_text text,
  visible boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index idx_gallery_visible on gallery(visible) where visible = true;

-- =====================================================================
-- TABLE: customers (clientas — CRM básico)
-- =====================================================================
create table customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  email text not null,
  birthday date,
  notes text,
  total_bookings integer default 0,
  total_spent integer default 0,
  last_visit_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index idx_customers_email on customers(lower(email));
create index idx_customers_phone on customers(phone);

-- =====================================================================
-- TABLE: bookings (citas/reservas)
-- =====================================================================
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  -- Snapshot de datos para histórico (si borran servicio/cliente)
  service_name text not null,
  service_price integer not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  notes text,
  starts_at timestamptz not null,
  duration_minutes integer not null,
  status booking_status default 'pending',
  google_event_id text,
  discount_code_id uuid,
  discount_amount integer default 0,
  final_price integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_bookings_starts_at on bookings(starts_at);
create index idx_bookings_status on bookings(status);
create index idx_bookings_customer on bookings(customer_id);

-- =====================================================================
-- TABLE: blocked_slots (bloqueos manuales: vacaciones, descansos)
-- =====================================================================
create table blocked_slots (
  id uuid primary key default uuid_generate_v4(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz default now()
);

create index idx_blocked_slots_range on blocked_slots(starts_at, ends_at);

-- =====================================================================
-- TABLE: business_hours (horarios de atención por día de la semana)
-- =====================================================================
-- day_of_week: 0 = domingo, 1 = lunes, ..., 6 = sábado
create table business_hours (
  id uuid primary key default uuid_generate_v4(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_open boolean default true,
  morning_open time,
  morning_close time,
  afternoon_open time,
  afternoon_close time,
  evening_open time,
  evening_close time,
  slot_duration_minutes integer default 30,
  updated_at timestamptz default now()
);

create unique index idx_business_hours_day on business_hours(day_of_week);

-- =====================================================================
-- TABLE: discount_codes (códigos de descuento)
-- =====================================================================
create table discount_codes (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  description text,
  discount_type discount_type not null,
  discount_value integer not null check (discount_value > 0),
  min_amount integer default 0,
  max_uses integer,
  uses_count integer default 0,
  valid_from timestamptz default now(),
  valid_until timestamptz,
  active boolean default true,
  created_at timestamptz default now()
);

create index idx_discount_codes_active on discount_codes(active, code) where active = true;

-- =====================================================================
-- TABLE: testimonials (testimonios — moderables)
-- =====================================================================
create table testimonials (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  customer_role text,
  customer_avatar text,
  rating smallint not null check (rating between 1 and 5),
  text text not null,
  visible boolean default false,
  featured boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index idx_testimonials_visible on testimonials(visible) where visible = true;

-- =====================================================================
-- TABLE: site_settings (CMS lite: textos editables del sitio)
-- =====================================================================
-- key/value para guardar configuración flexible del sitio
create table site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- =====================================================================
-- TRIGGER: actualizar updated_at automáticamente
-- =====================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_services_updated before update on services
  for each row execute function set_updated_at();
create trigger trg_customers_updated before update on customers
  for each row execute function set_updated_at();
create trigger trg_bookings_updated before update on bookings
  for each row execute function set_updated_at();
create trigger trg_business_hours_updated before update on business_hours
  for each row execute function set_updated_at();
create trigger trg_site_settings_updated before update on site_settings
  for each row execute function set_updated_at();

-- =====================================================================
-- TRIGGER: actualizar stats de customer cuando se completa booking
-- =====================================================================
create or replace function update_customer_stats()
returns trigger as $$
begin
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    update customers
    set
      total_bookings = total_bookings + 1,
      total_spent = total_spent + new.final_price,
      last_visit_at = new.starts_at
    where id = new.customer_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_booking_complete_stats
  after update on bookings
  for each row execute function update_customer_stats();
