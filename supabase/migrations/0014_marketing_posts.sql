-- Rediseño de marketing_posts para el módulo Marketing (calendario de
-- acciones de comunicación por mes). La tabla original (de 0001_init.sql)
-- nunca tuvo una pantalla propia ni datos cargados, así que se recrea
-- directamente con las columnas nuevas en vez de ir migrando de a una:
-- concept (Concepto), business_unit_id (Vertical: Mundo Hogar /
-- Equipamientos MH, reutilizando la tabla business_units existente),
-- publish_date (Fecha), content_type (Contenido: educacional/marca/
-- comercial), is_scheduled (Pautado) e investment_ars (Inversión).
--
-- Seguro de ejecutar más de una vez.

drop table if exists marketing_posts;

create table marketing_posts (
  id               uuid primary key default gen_random_uuid(),
  concept          text not null,
  business_unit_id uuid references business_units(id),
  publish_date     date not null,
  content_type     text check (content_type in ('educacional', 'marca', 'comercial')),
  is_scheduled     boolean not null default false,
  investment_ars   numeric(12,2) not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index marketing_posts_publish_date_idx on marketing_posts(publish_date);
create index marketing_posts_business_unit_idx on marketing_posts(business_unit_id);

create or replace trigger marketing_posts_set_updated_at
  before update on marketing_posts
  for each row execute function set_updated_at();

alter table marketing_posts enable row level security;

drop policy if exists "authenticated_full_access" on marketing_posts;
create policy "authenticated_full_access" on marketing_posts
  for all to authenticated using (true) with check (true);
