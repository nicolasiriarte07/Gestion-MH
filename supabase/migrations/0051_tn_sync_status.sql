-- Snapshot diario de sincronización de stock con Tiendanube. Lo carga
-- un proceso externo (no esta app) — acá solo se define la tabla; el
-- tablero de Inicio lee la última fecha cargada.
--
-- Importante: la política de abajo solo permite escribir a sesiones
-- autenticadas. Si el proceso externo que va a insertar filas usa la
-- clave anon (no una sesión logueada) o la service role key, no hace
-- falta tocar nada (la service role key ignora RLS); si en cambio pega
-- con la clave anon sin login, esa política va a bloquear el insert y
-- hay que avisarme para ajustarla.
create table tn_sync_status (
  id              uuid primary key default gen_random_uuid(),
  fecha           date,
  sku             text,
  producto        text,
  stock_gestion   int,
  stock_tn        int,
  estado          text check (estado in ('critico', 'desincronizado', 'stock_bajo')),
  accion          text,
  created_at      timestamptz default now()
);

create index tn_sync_status_fecha_idx on tn_sync_status(fecha);

alter table tn_sync_status enable row level security;

drop policy if exists "authenticated_full_access" on tn_sync_status;
create policy "authenticated_full_access" on tn_sync_status
  for all to authenticated using (true) with check (true);
