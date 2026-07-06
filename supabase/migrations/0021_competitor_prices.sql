-- Módulo "Precios de competencia": buscar un producto y ver su precio en
-- 7 sitios de la competencia. La búsqueda es automática por nombre en
-- cada sitio (no hay un link guardado por producto), así que el resultado
-- siempre guarda también el nombre encontrado (`matched_title`) para que
-- se pueda confirmar a simple vista que es el mismo producto.
--
-- Seguro de ejecutar más de una vez.

create table if not exists competitor_sites (
  id   uuid primary key default gen_random_uuid(),
  key  text not null unique,
  name text not null
);

insert into competitor_sites (key, name) values
  ('mercadolibre', 'MercadoLibre'),
  ('fravega', 'Fravega'),
  ('hendel', 'Hendel'),
  ('musimundo', 'Musimundo'),
  ('casa_silvia', 'Casa Silvia'),
  ('casa_carlitos', 'Casa Carlitos'),
  ('casa_del_audio', 'Casa del Audio')
on conflict (key) do nothing;

-- Último resultado de búsqueda por producto+sitio. No se rebusca todo
-- cada vez que se abre la pantalla; se refresca a pedido con un botón.
create table if not exists product_competitor_prices (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  site_id       uuid not null references competitor_sites(id) on delete cascade,
  matched_title text,
  matched_url   text,
  price         numeric(12,2),
  status        text not null default 'ok' check (status in ('ok', 'not_found', 'error')),
  checked_at    timestamptz not null default now(),
  unique (product_id, site_id)
);

create index if not exists product_competitor_prices_product_idx
  on product_competitor_prices(product_id);

alter table competitor_sites enable row level security;
alter table product_competitor_prices enable row level security;

drop policy if exists "authenticated_full_access" on competitor_sites;
create policy "authenticated_full_access" on competitor_sites
  for all to authenticated using (true) with check (true);
drop policy if exists "authenticated_full_access" on product_competitor_prices;
create policy "authenticated_full_access" on product_competitor_prices
  for all to authenticated using (true) with check (true);
