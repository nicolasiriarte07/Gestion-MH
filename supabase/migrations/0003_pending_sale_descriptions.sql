-- Agrupa las líneas de venta pendientes por descripción + unidad de
-- negocio, para que la pantalla de revisión de coincidencias muestre una
-- tarjeta por descripción distinta (no una por cada línea histórica).
create or replace function pending_sale_descriptions()
returns table (
  product_description_raw text,
  business_unit_id uuid,
  row_count int
)
language sql
stable
as $$
  -- count(*)::int en vez de bigint: PostgREST serializa bigint como string
  -- en JSON, y el volumen de filas por descripción nunca se acerca al
  -- límite de un int de 32 bits.
  select product_description_raw, business_unit_id, count(*)::int as row_count
  from sale_items
  where match_status = 'pending'
  group by product_description_raw, business_unit_id
  order by row_count desc;
$$;
