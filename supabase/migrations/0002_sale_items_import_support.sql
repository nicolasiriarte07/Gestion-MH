-- Soporte para la importación real del histórico de ventas
-- (FACTURAS_MH___EXC_NC.xlsx): agrega la unidad de negocio (columna
-- "Vertical" del archivo) y el código de artículo original (columna
-- "Articulo"), que permite un primer nivel de matching exacto antes de
-- recurrir al matching aproximado por descripción.
--
-- Seguro de ejecutar más de una vez.

alter table sale_items
  add column if not exists business_unit_id uuid references business_units(id),
  add column if not exists source_article_code text;

create index if not exists sale_items_business_unit_idx on sale_items(business_unit_id);
create index if not exists sale_items_description_trgm_idx
  on sale_items using gin (product_description_raw gin_trgm_ops);
