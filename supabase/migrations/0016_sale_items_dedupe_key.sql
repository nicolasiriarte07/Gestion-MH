-- Detección de duplicados al reimportar el histórico de ventas: columna
-- generada que resume el "contenido" de cada línea (fecha, cliente,
-- descripción, cantidad, monto, comprobante). Reimportar el mismo
-- archivo ya no duplica filas: la importación pasa a hacer upsert contra
-- esta clave, así que las filas que ya existían simplemente se omiten
-- (no se tocan match_status/product_id ya confirmados a mano en Revisar
-- coincidencias) y solo se insertan las líneas realmente nuevas.
--
-- Seguro de ejecutar más de una vez.

-- date::text no es una expresión "immutable" para Postgres (depende del
-- parámetro de sesión DateStyle), así que la fecha se convierte a texto
-- vía epoch (sí es immutable) en vez de castear directo.
alter table sale_items
  add column if not exists dedupe_key text generated always as (
    md5(
      coalesce(extract(epoch from sale_date)::bigint::text, '') || '|' ||
      coalesce(trim(lower(customer_name)), '') || '|' ||
      coalesce(trim(lower(product_description_raw)), '') || '|' ||
      coalesce(quantity::text, '') || '|' ||
      coalesce(subtotal_with_iva::text, '') || '|' ||
      coalesce(trim(lower(receipt_letter)), '') || '|' ||
      coalesce(trim(lower(receipt_number)), '')
    )
  ) stored;

create unique index if not exists sale_items_dedupe_key_idx on sale_items(dedupe_key);
