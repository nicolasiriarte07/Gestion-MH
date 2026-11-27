-- Compras: más información visual en el tablero Kanban. Solo agrega
-- columnas/tabla nuevas, no toca ni borra nada existente; todo lo
-- nuevo queda vacío o en su default hasta que se cargue a mano o se
-- use desde la app.
alter table purchase_orders
  add column if not exists amount_paid numeric(12,2) not null default 0,
  add column if not exists traveler_phone text,
  add column if not exists stock_loaded boolean not null default false;

-- Historial de cambios de etapa (pedido/confirmado/en_camino/recibido),
-- para saber cuándo pasó cada pedido por cada estado (ej. para acotar
-- la columna "Recibido" a los últimos 30 días).
create table if not exists purchase_order_stage_history (
  id                  uuid primary key default gen_random_uuid(),
  purchase_order_id   uuid not null references purchase_orders(id) on delete cascade,
  estado              text not null,
  changed_at          timestamptz not null default now()
);

create index if not exists purchase_order_stage_history_order_id_idx
  on purchase_order_stage_history(purchase_order_id);

alter table purchase_order_stage_history enable row level security;
drop policy if exists "authenticated_full_access" on purchase_order_stage_history;
create policy "authenticated_full_access" on purchase_order_stage_history
  for all to authenticated using (true) with check (true);

-- Backfill: una fila de historial por pedido ya existente, con su
-- estado actual y la fecha de la última modificación como mejor
-- aproximación (no hay forma de reconstruir el historial real de
-- cambios anteriores a este alta).
insert into purchase_order_stage_history (purchase_order_id, estado, changed_at)
select po.id, po.estado, po.updated_at
from purchase_orders po
where not exists (
  select 1 from purchase_order_stage_history h where h.purchase_order_id = po.id
);
