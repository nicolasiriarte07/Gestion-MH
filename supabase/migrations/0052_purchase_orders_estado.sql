-- Compras pasa de un solo checkbox "confirmado" a un estado con 4
-- etapas (Pedido / Confirmado / En camino / Recibido) para el tablero
-- Kanban, más una fecha de llegada. No se borra la columna confirmed
-- (por si algo viejo la lee); los pedidos ya confirmados pasan a
-- "confirmado" y el resto queda en "pedido".
alter table purchase_orders
  add column if not exists estado text not null default 'pedido',
  add column if not exists arrival_date date;

alter table purchase_orders
  drop constraint if exists purchase_orders_estado_check;
alter table purchase_orders
  add constraint purchase_orders_estado_check
  check (estado in ('pedido', 'confirmado', 'en_camino', 'recibido'));

update purchase_orders
  set estado = 'confirmado'
  where confirmed = true and estado = 'pedido';
