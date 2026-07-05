-- Columna Marca para el inventario: tabla brands (igual patrón que
-- categories) precargada con las marcas del negocio, y products.brand_id
-- nullable, sin asignar por defecto para que se complete a mano desde la
-- tabla de inventario.
--
-- Seguro de ejecutar más de una vez.

create table if not exists brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

alter table brands enable row level security;

drop policy if exists "authenticated_full_access" on brands;
create policy "authenticated_full_access" on brands
  for all to authenticated using (true) with check (true);

insert into brands (name) values
  ('Philips'),
  ('Ga.ma'),
  ('Noblex'),
  ('BGH'),
  ('Eiffel'),
  ('Atma'),
  ('Liliana'),
  ('Oster'),
  ('Aspen'),
  ('Yelmo'),
  ('Ultracomb'),
  ('Drean'),
  ('TCL'),
  ('Samsung'),
  ('Motorola'),
  ('Electrolux'),
  ('Kanji'),
  ('Redmi'),
  ('Smartlife'),
  ('Exo'),
  ('Sky'),
  ('Enova')
on conflict (name) do nothing;

alter table products
  add column if not exists brand_id uuid references brands(id);

create index if not exists products_brand_idx on products(brand_id);
