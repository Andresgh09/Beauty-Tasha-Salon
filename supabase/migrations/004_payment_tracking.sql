-- =====================================================================
-- Beauty Tasha Salón — Migration 004: Payment Tracking
-- =====================================================================
-- COPIAR Y PEGAR EN: Supabase Dashboard → SQL Editor → New Query → Run
-- =====================================================================
-- Agrega tracking financiero a las citas:
--   - Método de pago (efectivo, SINPE, transferencia, tarjeta, otro)
--   - Monto realmente pagado (puede diferir del precio del servicio)
--   - Timestamp del cobro
-- =====================================================================

-- 1) Enum de métodos de pago
create type payment_method as enum (
  'cash',       -- Efectivo
  'transfer',   -- Transferencia bancaria
  'sinpe',      -- SINPE Móvil
  'card',       -- Tarjeta de crédito/débito
  'other'       -- Otro (gift card, etc.)
);

-- 2) Columnas nuevas en bookings
alter table bookings
  add column payment_method payment_method,
  add column paid_amount integer check (paid_amount >= 0),
  add column paid_at timestamptz;

-- 3) Índice para consultas de finanzas por fecha
create index idx_bookings_paid_at on bookings(paid_at)
  where paid_at is not null;

-- 4) Índice para agrupar por método de pago
create index idx_bookings_payment_method on bookings(payment_method)
  where payment_method is not null;

-- 5) Comentarios (opcional, para documentar)
comment on column bookings.payment_method is 'Método de pago usado por la clienta';
comment on column bookings.paid_amount is 'Monto realmente cobrado (en colones, puede diferir de final_price por propinas/ajustes)';
comment on column bookings.paid_at is 'Cuándo se registró el cobro (auto-set cuando status pasa a completed)';

-- 6) Verificación
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_name = 'bookings'
  and column_name in ('payment_method', 'paid_amount', 'paid_at')
order by ordinal_position;
