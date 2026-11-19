-- Módulo Compras: pedidos a marcas/proveedores, con sus líneas de
-- producto. Reemplaza la planilla que se maneja hoy a mano (fecha,
-- marca, viajante, tipo de pago, productos con cantidad/monto,
-- confirmado), separado por unidad de negocio (Mundo Hogar /
-- Equipamientos MH).
create table purchase_orders (
  id                  uuid primary key default gen_random_uuid(),
  business_unit_id    uuid references business_units(id) on delete set null,
  order_date          date not null,
  brand_id            uuid references brands(id) on delete set null,
  traveler            text,
  payment_type        text,
  confirmed           boolean not null default false,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- product_description guarda una foto del nombre del producto al
-- momento del pedido (igual que sale_items.product_description_raw),
-- así el pedido sigue siendo legible aunque el producto se borre o
-- cambie de nombre en Inventario más adelante.
create table purchase_order_items (
  id                    uuid primary key default gen_random_uuid(),
  purchase_order_id     uuid not null references purchase_orders(id) on delete cascade,
  product_id            uuid references products(id) on delete set null,
  product_description   text not null,
  quantity              numeric(12,2) not null default 0,
  amount                numeric(12,2) not null default 0,
  created_at            timestamptz not null default now()
);

create index purchase_orders_business_unit_id_idx on purchase_orders(business_unit_id);
create index purchase_orders_order_date_idx on purchase_orders(order_date);
create index purchase_order_items_purchase_order_id_idx on purchase_order_items(purchase_order_id);

create or replace trigger purchase_orders_set_updated_at
  before update on purchase_orders
  for each row execute function set_updated_at();

alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;

drop policy if exists "authenticated_full_access" on purchase_orders;
create policy "authenticated_full_access" on purchase_orders
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_full_access" on purchase_order_items;
create policy "authenticated_full_access" on purchase_order_items
  for all to authenticated using (true) with check (true);
