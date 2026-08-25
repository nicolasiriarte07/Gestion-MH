-- Módulo CRM de contactos de EQUIPAMIENTOS MH (comercios que compran
-- equipamiento: carnicerías, panaderías, restaurantes, etc. — no confundir
-- con `products`/`sale_items`, que son ventas ya hechas).

create table equipamientos_contacts (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  business_name      text,
  city               text,
  phone              text,
  category           text not null default 'Otro'
    check (category in ('Carnicería', 'Panadería', 'Restaurant', 'Almacén', 'Supermercado', 'Otro')),
  last_contact_date  date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index equipamientos_contacts_category_idx on equipamientos_contacts(category);

create or replace trigger equipamientos_contacts_set_updated_at
  before update on equipamientos_contacts
  for each row execute function set_updated_at();

alter table equipamientos_contacts enable row level security;

drop policy if exists "authenticated_full_access" on equipamientos_contacts;
create policy "authenticated_full_access" on equipamientos_contacts
  for all to authenticated using (true) with check (true);
