-- =====================================================================
-- Beauty Tasha Salón — Row Level Security (RLS) Policies
-- =====================================================================
-- Estrategia:
--  - Lectura pública: services, gallery, testimonials, business_hours
--    (solo registros marcados como visible)
--  - Escritura: solo admin (autenticado via Supabase Auth)
--  - bookings: cualquiera puede crear (formulario público).
--    Lectura/edición solo admin.
--  - customers: solo admin (datos privados)
-- =====================================================================

-- Habilitar RLS en todas las tablas
alter table services enable row level security;
alter table gallery enable row level security;
alter table customers enable row level security;
alter table bookings enable row level security;
alter table blocked_slots enable row level security;
alter table business_hours enable row level security;
alter table discount_codes enable row level security;
alter table testimonials enable row level security;
alter table site_settings enable row level security;

-- =====================================================================
-- SERVICES — lectura pública (solo visibles), escritura admin
-- =====================================================================
create policy "public can read visible services"
  on services for select
  using (visible = true);

create policy "admin can do all on services"
  on services for all
  to authenticated
  using (true) with check (true);

-- =====================================================================
-- GALLERY — lectura pública (solo visibles), escritura admin
-- =====================================================================
create policy "public can read visible gallery"
  on gallery for select
  using (visible = true);

create policy "admin can do all on gallery"
  on gallery for all
  to authenticated
  using (true) with check (true);

-- =====================================================================
-- TESTIMONIALS — lectura pública (solo aprobados), escritura admin
-- =====================================================================
create policy "public can read visible testimonials"
  on testimonials for select
  using (visible = true);

create policy "admin can do all on testimonials"
  on testimonials for all
  to authenticated
  using (true) with check (true);

-- =====================================================================
-- BUSINESS_HOURS — lectura pública, escritura admin
-- =====================================================================
create policy "public can read business hours"
  on business_hours for select
  using (true);

create policy "admin can do all on business hours"
  on business_hours for all
  to authenticated
  using (true) with check (true);

-- =====================================================================
-- BOOKINGS — público puede crear, admin lee/edita todo
-- =====================================================================
-- Insert público: cualquier visitante puede crear una reserva
create policy "public can create bookings"
  on bookings for insert
  with check (true);

-- Lectura/edición: solo admin autenticado
create policy "admin can read all bookings"
  on bookings for select
  to authenticated
  using (true);

create policy "admin can update bookings"
  on bookings for update
  to authenticated
  using (true) with check (true);

create policy "admin can delete bookings"
  on bookings for delete
  to authenticated
  using (true);

-- =====================================================================
-- CUSTOMERS — público puede crear (al reservar), admin lee/edita
-- =====================================================================
create policy "public can create customers"
  on customers for insert
  with check (true);

create policy "admin can read customers"
  on customers for select
  to authenticated
  using (true);

create policy "admin can update customers"
  on customers for update
  to authenticated
  using (true) with check (true);

create policy "admin can delete customers"
  on customers for delete
  to authenticated
  using (true);

-- =====================================================================
-- BLOCKED_SLOTS — lectura pública (necesario para mostrar disponibilidad),
--                 escritura admin
-- =====================================================================
create policy "public can read blocked slots"
  on blocked_slots for select
  using (true);

create policy "admin can do all on blocked slots"
  on blocked_slots for all
  to authenticated
  using (true) with check (true);

-- =====================================================================
-- DISCOUNT_CODES — lectura pública limitada (solo para validar al usar),
--                  escritura admin
-- =====================================================================
create policy "public can validate discount codes"
  on discount_codes for select
  using (active = true and (valid_until is null or valid_until > now()));

create policy "admin can do all on discount codes"
  on discount_codes for all
  to authenticated
  using (true) with check (true);

-- =====================================================================
-- SITE_SETTINGS — lectura pública, escritura admin
-- =====================================================================
create policy "public can read site settings"
  on site_settings for select
  using (true);

create policy "admin can do all on site settings"
  on site_settings for all
  to authenticated
  using (true) with check (true);
