-- =====================================================================
-- Beauty Tasha Salón — Migration 007: Evitar dobles reservas (atómico)
-- =====================================================================
-- COPIAR Y PEGAR EN: Supabase Dashboard → SQL Editor → New Query → Run
-- =====================================================================
-- Problema: la validación de disponibilidad se hacía en JS (leer slots →
-- insertar). Dos clientas reservando el mismo horario casi al mismo tiempo
-- ambas pasaban el check (ninguna veía la reserva de la otra todavía) y
-- ambas insertaban → doble reserva.
--
-- Solución: un EXCLUDE constraint a nivel de Postgres. La base de datos
-- rechaza atómicamente cualquier insert que solape en tiempo con otra
-- reserva activa. No hay race posible — es imposible que entren dos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PASO 1 (IMPORTANTE): revisar si YA hay reservas solapadas.
-- Si las hay, el constraint del paso 3 va a FALLAR hasta que las
-- resuelvas (cancelar una de cada par). Corré esto primero y mirá el
-- resultado. Si devuelve 0 filas, seguí directo al paso 3.
-- ---------------------------------------------------------------------
select
  a.id           as reserva_a,
  a.customer_name as cliente_a,
  a.starts_at    as inicio_a,
  b.id           as reserva_b,
  b.customer_name as cliente_b,
  b.starts_at    as inicio_b
from bookings a
join bookings b
  on a.id < b.id
 and a.status in ('pending','confirmed')
 and b.status in ('pending','confirmed')
 and tstzrange(a.starts_at, a.starts_at + make_interval(mins => a.duration_minutes))
     && tstzrange(b.starts_at, b.starts_at + make_interval(mins => b.duration_minutes))
order by a.starts_at;

-- ---------------------------------------------------------------------
-- PASO 2: extensión necesaria para EXCLUDE sobre rangos + columnas.
-- ---------------------------------------------------------------------
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- PASO 3: el constraint anti-overlap.
-- Solo aplica a reservas PENDING/CONFIRMED (las citas futuras/activas que
-- compiten por el tiempo de Tasha). Las completed/cancelled/no_show NO
-- bloquean: las completadas ya pasaron, y cancelled/no_show liberan el
-- horario. Esto también evita que solapes históricos (bug viejo) impidan
-- crear el constraint — basta marcar las pasadas como completed/no_show.
-- Rangos half-open [inicio, fin): una cita 9-10 y otra 10-11 NO solapan
-- (adyacentes están permitidas), igual que la lógica del front.
-- ---------------------------------------------------------------------
alter table bookings
  add constraint bookings_no_overlap
  exclude using gist (
    tstzrange(starts_at, starts_at + make_interval(mins => duration_minutes)) with &&
  )
  where (status in ('pending','confirmed'));

-- ---------------------------------------------------------------------
-- PASO 4: verificación — debería listar el constraint recién creado.
-- ---------------------------------------------------------------------
select conname, contype
from pg_constraint
where conrelid = 'bookings'::regclass
  and conname = 'bookings_no_overlap';
