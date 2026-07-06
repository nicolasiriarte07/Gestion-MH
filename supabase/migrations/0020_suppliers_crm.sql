-- Módulo Proveedores (CRM). `suppliers` era un esqueleto sin pantalla ni
-- datos cargados (igual que `marketing_posts`/`ad_campaigns` antes de
-- rediseñarlas), así que se recrea directamente. Esto castea en cascada a
-- `purchases`/`purchase_items` (tampoco usadas todavía); un futuro módulo
-- de Compras va a definir sus propias tablas sobre esta forma nueva de
-- `suppliers`, no al revés.
--
-- Seguro de ejecutar más de una vez.

drop table if exists supplier_history cascade;
drop table if exists supplier_documents cascade;
drop table if exists supplier_ledger_entries cascade;
drop table if exists supplier_products cascade;
drop table if exists supplier_brands cascade;
drop table if exists suppliers cascade;

create table suppliers (
  id uuid primary key default gen_random_uuid(),

  -- Datos generales
  trade_name    text not null,
  legal_name    text,
  cuit          text,
  vat_condition text,
  gross_income  text,
  address       text,
  city          text,
  province      text,
  postal_code   text,
  country       text not null default 'Argentina',

  -- Contacto
  contact_name text,
  contact_role text,
  phone        text,
  whatsapp     text,
  email        text,
  website      text,

  -- Datos comerciales
  category       text,
  price_list     text,
  delivery_time  text,
  min_order      text,
  usual_discount numeric(5,2),

  -- Condiciones de pago
  payment_cash     boolean not null default false,
  payment_7d       boolean not null default false,
  payment_15d      boolean not null default false,
  payment_30d      boolean not null default false,
  payment_60d      boolean not null default false,
  payment_transfer boolean not null default false,
  payment_check    boolean not null default false,
  payment_card     boolean not null default false,
  payment_notes    text,

  -- Estado y notas internas
  is_active      boolean not null default true,
  internal_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index suppliers_category_idx on suppliers(category);

create or replace trigger suppliers_set_updated_at
  before update on suppliers
  for each row execute function set_updated_at();

-- Marcas que comercializa cada proveedor (reutiliza la tabla brands).
create table supplier_brands (
  supplier_id uuid not null references suppliers(id) on delete cascade,
  brand_id    uuid not null references brands(id) on delete cascade,
  primary key (supplier_id, brand_id)
);

-- Productos que provee (reutiliza products; costo propio del proveedor,
-- precio de venta/margen/stock se leen del producto, no se duplican).
create table supplier_products (
  id                 uuid primary key default gen_random_uuid(),
  supplier_id        uuid not null references suppliers(id) on delete cascade,
  product_id         uuid not null references products(id) on delete cascade,
  supplier_cost      numeric(12,2),
  last_purchase_date date,
  created_at         timestamptz not null default now(),
  unique (supplier_id, product_id)
);

-- Cuenta corriente. Pagos es un subconjunto (kind = 'pago') de esta misma
-- tabla, para no mantener dos tablas en sincronía. "Compra" también vive
-- acá (kind = 'compra'), así el resumen de la ficha no depende de un
-- futuro módulo de Compras.
create table supplier_ledger_entries (
  id             uuid primary key default gen_random_uuid(),
  supplier_id    uuid not null references suppliers(id) on delete cascade,
  entry_date     date not null,
  kind           text not null check (kind in ('compra', 'pago', 'ajuste', 'nota_credito')),
  concept        text not null,
  debit          numeric(12,2) not null default 0,
  credit         numeric(12,2) not null default 0,
  status         text,
  payment_method text,
  receipt_number text,
  notes          text,
  created_at     timestamptz not null default now()
);

create index supplier_ledger_supplier_idx on supplier_ledger_entries(supplier_id, entry_date);

-- Saldo, última compra y cantidad de compras por proveedor, para que el
-- listado no tenga que bajar todo el ledger (mismo criterio que
-- product_sales_velocity/sales_by_customer).
create or replace view supplier_balances as
select
  supplier_id,
  sum(debit - credit) as balance,
  max(entry_date) filter (where kind = 'compra') as last_purchase_date,
  count(*) filter (where kind = 'compra') as purchase_count
from supplier_ledger_entries
group by supplier_id;

-- Documentos (facturas, notas de crédito, listas de precios, etc.) en un
-- bucket privado de Supabase Storage. El bloque `do` se salta solo (sin
-- error) en un Postgres común sin el schema `storage` de Supabase, para
-- poder probar esta migración contra una base local.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('supplier-documents', 'supplier-documents', false)
    on conflict (id) do nothing;
  end if;
end $$;

create table supplier_documents (
  id           uuid primary key default gen_random_uuid(),
  supplier_id  uuid not null references suppliers(id) on delete cascade,
  doc_type     text check (doc_type in ('factura', 'nota_credito', 'lista_precios', 'otro')),
  file_name    text not null,
  storage_path text not null,
  mime_type    text,
  file_size    integer,
  uploaded_at  timestamptz not null default now()
);

-- Historial (timeline), poblado por las server actions de cada acción
-- relevante (alta, compra, pago, cambio de condiciones/estado).
create table supplier_history (
  id          uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  event_type  text not null,
  description text not null,
  occurred_at timestamptz not null default now()
);

create index supplier_history_supplier_idx on supplier_history(supplier_id, occurred_at);

alter table suppliers enable row level security;
alter table supplier_brands enable row level security;
alter table supplier_products enable row level security;
alter table supplier_ledger_entries enable row level security;
alter table supplier_documents enable row level security;
alter table supplier_history enable row level security;

drop policy if exists "authenticated_full_access" on suppliers;
create policy "authenticated_full_access" on suppliers
  for all to authenticated using (true) with check (true);
drop policy if exists "authenticated_full_access" on supplier_brands;
create policy "authenticated_full_access" on supplier_brands
  for all to authenticated using (true) with check (true);
drop policy if exists "authenticated_full_access" on supplier_products;
create policy "authenticated_full_access" on supplier_products
  for all to authenticated using (true) with check (true);
drop policy if exists "authenticated_full_access" on supplier_ledger_entries;
create policy "authenticated_full_access" on supplier_ledger_entries
  for all to authenticated using (true) with check (true);
drop policy if exists "authenticated_full_access" on supplier_documents;
create policy "authenticated_full_access" on supplier_documents
  for all to authenticated using (true) with check (true);
drop policy if exists "authenticated_full_access" on supplier_history;
create policy "authenticated_full_access" on supplier_history
  for all to authenticated using (true) with check (true);

-- Solo autenticados pueden leer/escribir archivos de este bucket (mismo
-- salto para poder probar localmente, ver comentario arriba).
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    execute 'drop policy if exists "authenticated_full_access_supplier_docs" on storage.objects';
    execute $policy$
      create policy "authenticated_full_access_supplier_docs" on storage.objects
        for all to authenticated
        using (bucket_id = 'supplier-documents')
        with check (bucket_id = 'supplier-documents')
    $policy$;
  end if;
end $$;
