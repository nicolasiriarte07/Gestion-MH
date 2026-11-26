-- Vincula cada venta de Equipamientos con el contacto del CRM al que
-- corresponde. No se tocan ni se borran "cliente"/"comercio" (siguen
-- existiendo y se siguen completando a mano o automáticamente desde el
-- contacto elegido) — contact_id es un vínculo adicional, nullable,
-- para no romper ventas históricas que todavía no estén vinculadas.
alter table equipamientos_sales
  add column if not exists contact_id uuid references equipamientos_contacts(id) on delete set null;

create index if not exists equipamientos_sales_contact_id_idx on equipamientos_sales(contact_id);
