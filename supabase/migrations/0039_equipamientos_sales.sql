-- Módulo Ventas de EQUIPAMIENTOS MH (traído desde la app vieja en Vercel:
-- tabla "sales" de ese proyecto). Cada fila es una venta ya cerrada, con
-- estado de cobro/entrega propio — no es un libro contable de
-- débitos/créditos como `supplier_ledger_entries`, replica 1 a 1 la
-- pantalla "Gestión de Ventas" de la app original.

create table equipamientos_sales (
  id                uuid primary key default gen_random_uuid(),
  cliente           text not null,
  comercio          text,
  mes               text,
  fecha             date,
  producto          text not null,
  categoria         text,
  monto             numeric(12,2) not null default 0,
  metodo_pago       text
    check (metodo_pago in ('contado', 'pago semanal', 'tarjeta', 'cheque')),
  entrega_inicial   numeric(12,2) not null default 0,
  cuota_semanal     numeric(12,2),
  cobrado           boolean not null default false,
  entregado         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index equipamientos_sales_fecha_idx on equipamientos_sales(fecha);
create index equipamientos_sales_cliente_idx on equipamientos_sales(cliente);

create or replace trigger equipamientos_sales_set_updated_at
  before update on equipamientos_sales
  for each row execute function set_updated_at();

alter table equipamientos_sales enable row level security;

drop policy if exists "authenticated_full_access" on equipamientos_sales;
create policy "authenticated_full_access" on equipamientos_sales
  for all to authenticated using (true) with check (true);
