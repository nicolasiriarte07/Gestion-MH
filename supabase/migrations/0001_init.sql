-- MUNDO HOGAR / EQUIPAMIENTOS MH - Esquema inicial
-- Ver README.md para el diagrama y las decisiones de diseño.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Módulo 1: Inventario
-- ---------------------------------------------------------------------------

create table business_units (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (category_id, name)
);

create table products (
  id               uuid primary key default gen_random_uuid(),
  sku              text not null unique,
  description      text not null,
  cost             numeric(12,2) not null default 0,
  sale_price       numeric(12,2) not null default 0,
  stock            integer not null default 0,
  is_web           boolean not null default false,
  business_unit_id uuid not null references business_units(id),
  category_id      uuid references categories(id),
  subcategory_id   uuid references subcategories(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create extension if not exists pg_trgm;

create index products_business_unit_idx on products(business_unit_id);
create index products_category_idx on products(category_id);
create index products_subcategory_idx on products(subcategory_id);
create index products_is_web_idx on products(is_web);
create index products_description_trgm_idx on products using gin (description gin_trgm_ops);

create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Módulo 2: Proveedores
-- ---------------------------------------------------------------------------

create table suppliers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text,
  email      text,
  notes      text,
  created_at timestamptz not null default now()
);

create table purchases (
  id            uuid primary key default gen_random_uuid(),
  supplier_id   uuid not null references suppliers(id),
  purchase_date date not null,
  notes         text,
  created_at    timestamptz not null default now()
);

create table purchase_items (
  id          uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id  uuid not null references products(id),
  quantity    numeric(12,2) not null,
  unit_cost   numeric(12,2) not null
);

create index purchase_items_purchase_idx on purchase_items(purchase_id);
create index purchase_items_product_idx on purchase_items(product_id);

-- ---------------------------------------------------------------------------
-- Módulo 3: Marketing
-- ---------------------------------------------------------------------------

create table marketing_posts (
  id           uuid primary key default gen_random_uuid(),
  publish_date date not null,
  channel      text not null,
  title        text,
  notes        text,
  status       text not null default 'planificado'
               check (status in ('planificado', 'publicado')),
  created_at   timestamptz not null default now()
);

create table ad_campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  platform     text not null,
  budget       numeric(12,2),
  start_date   date,
  end_date     date,
  result_notes text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Módulo 4: Ventas (histórico, para importación futura de Dash1nico.xlsx)
-- ---------------------------------------------------------------------------

create table sale_items (
  id                       uuid primary key default gen_random_uuid(),
  receipt_letter           text,
  sale_date                date not null,
  customer_code            text,
  customer_name            text,
  payment_method           text,
  product_description_raw text not null,
  quantity                 numeric(12,2) not null,
  iva                      numeric(12,2),
  subtotal_with_iva        numeric(12,2) not null,
  product_id               uuid references products(id),
  match_status             text not null default 'pending'
                            check (match_status in ('pending', 'confirmed', 'rejected', 'no_match')),
  match_confidence         numeric(5,2),
  created_at               timestamptz not null default now()
);

create index sale_items_product_idx on sale_items(product_id);
create index sale_items_match_status_idx on sale_items(match_status);

-- ---------------------------------------------------------------------------
-- Row Level Security: un solo usuario autenticado, sin acceso anónimo
-- ---------------------------------------------------------------------------

alter table business_units enable row level security;
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table products enable row level security;
alter table suppliers enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table marketing_posts enable row level security;
alter table ad_campaigns enable row level security;
alter table sale_items enable row level security;

create policy "authenticated_full_access" on business_units
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on categories
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on subcategories
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on products
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on suppliers
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on purchases
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on purchase_items
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on marketing_posts
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on ad_campaigns
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on sale_items
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Datos base: las dos unidades de negocio conocidas
-- ---------------------------------------------------------------------------

insert into business_units (name) values ('MUNDO HOGAR'), ('EQUIPAMIENTOS MH');
