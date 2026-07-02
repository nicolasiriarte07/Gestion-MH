-- Soporte para la importación real del histórico de ventas
-- (FACTURAS_MH___EXC_NC.xlsx): agrega la unidad de negocio (columna
-- "Vertical" del archivo) y el código de artículo original (columna
-- "Articulo"), que permite un primer nivel de matching exacto antes de
-- recurrir al matching aproximado por descripción.

alter table sale_items
  add column business_unit_id uuid references business_units(id),
  add column source_article_code text;

create index sale_items_business_unit_idx on sale_items(business_unit_id);
create index sale_items_description_trgm_idx
  on sale_items using gin (product_description_raw gin_trgm_ops);
