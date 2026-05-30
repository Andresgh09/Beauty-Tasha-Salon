-- =====================================================================
-- Beauty Tasha Salón — Migration 006: Expenses (Gastos)
-- =====================================================================
-- COPIAR Y PEGAR EN: Supabase Dashboard → SQL Editor → New Query → Run
-- =====================================================================
-- Permite trackear gastos del negocio (materiales, alquiler, etc.)
-- para calcular utilidad neta = ingresos − gastos.
-- =====================================================================

-- 1) Enum de categorías de gastos
create type expense_category as enum (
  'materials',     -- Materiales (esmaltes, limas, acrílico, etc.)
  'rent',          -- Alquiler del local
  'utilities',     -- Servicios públicos (luz, agua, internet)
  'marketing',     -- Publicidad, redes sociales
  'salary',        -- Salarios / pagos a colaboradoras
  'equipment',     -- Equipo (lámparas UV, mesas, sillas)
  'maintenance',   -- Mantenimiento del local
  'transport',     -- Transporte
  'other'          -- Otros
);

-- 2) Tabla expenses
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  category expense_category not null default 'other',
  description text not null,
  amount integer not null check (amount > 0),
  spent_at timestamptz not null default now(),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_expenses_spent_at on expenses(spent_at desc);
create index if not exists idx_expenses_category on expenses(category);

comment on table expenses is 'Gastos del negocio para tracking de utilidad neta.';
comment on column expenses.amount is 'Monto en colones (entero)';

-- 3) Trigger updated_at
create trigger expenses_updated_at
  before update on expenses
  for each row
  execute function update_updated_at_column();

-- 4) RLS — solo admin (authenticated) puede ver/editar
alter table expenses enable row level security;

create policy "admin can read all expenses"
  on expenses for select
  to authenticated
  using (true);

create policy "admin can insert expenses"
  on expenses for insert
  to authenticated
  with check (true);

create policy "admin can update expenses"
  on expenses for update
  to authenticated
  using (true) with check (true);

create policy "admin can delete expenses"
  on expenses for delete
  to authenticated
  using (true);

-- 5) GRANTs
grant all privileges on expenses to authenticated, service_role;

-- 6) Verificación
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_name = 'expenses'
order by ordinal_position;
