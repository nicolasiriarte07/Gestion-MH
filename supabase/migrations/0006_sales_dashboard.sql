-- Soporte para el dashboard de ventas con control de períodos:
-- - category_raw: la columna "Categoria" del archivo de facturas, tal
--   cual (texto libre), para poder desglosar ventas por categoría sin
--   depender de que cada línea ya esté vinculada a un producto del
--   catálogo (la mayoría todavía está pendiente de revisión manual).
-- - receipt_number: la columna "Nombre_PDF" del archivo, identifica cada
--   comprobante único (una venta puede tener varias líneas/productos).
--   Permite contar "cantidad de ventas" en vez de "cantidad de líneas".
--
-- Seguro de ejecutar más de una vez.

alter table sale_items
  add column if not exists category_raw text,
  add column if not exists receipt_number text;

create index if not exists sale_items_sale_date_idx on sale_items(sale_date);
create index if not exists sale_items_receipt_number_idx on sale_items(receipt_number);

-- ---------------------------------------------------------------------------
-- Funciones de agregación para el dashboard. Todas reciben un rango de
-- fechas [from_date, to_date] inclusive y son "stable" (solo lectura, sin
-- SECURITY DEFINER: corren con los permisos del usuario autenticado, RLS
-- de sale_items sigue aplicando).
-- ---------------------------------------------------------------------------

create or replace function sales_summary(from_date date, to_date date)
returns table (
  total_ars numeric,
  receipt_count int,
  unit_count numeric,
  line_count int
)
language sql
stable
as $$
  select
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    count(distinct receipt_number)::int as receipt_count,
    coalesce(sum(quantity), 0) as unit_count,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date;
$$;

create or replace function sales_by_receipt_letter(from_date date, to_date date)
returns table (receipt_letter text, total_ars numeric, line_count int)
language sql
stable
as $$
  select
    coalesce(nullif(receipt_letter, ''), 'Sin dato') as receipt_letter,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by total_ars desc;
$$;

create or replace function sales_by_business_unit(from_date date, to_date date)
returns table (business_unit_id uuid, total_ars numeric, line_count int)
language sql
stable
as $$
  select
    business_unit_id,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by total_ars desc;
$$;

create or replace function sales_by_category(from_date date, to_date date)
returns table (category_raw text, total_ars numeric, line_count int)
language sql
stable
as $$
  select
    coalesce(nullif(category_raw, ''), 'Sin categoría') as category_raw,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by total_ars desc;
$$;

create or replace function sales_by_payment_method(from_date date, to_date date)
returns table (payment_method text, total_ars numeric, line_count int)
language sql
stable
as $$
  select
    coalesce(nullif(payment_method, ''), 'Sin dato') as payment_method,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by total_ars desc;
$$;

-- bucket: 'day' | 'week' | 'month'
create or replace function sales_timeseries(from_date date, to_date date, bucket text)
returns table (bucket_start date, total_ars numeric)
language sql
stable
as $$
  select
    date_trunc(bucket, sale_date)::date as bucket_start,
    sum(subtotal_with_iva) as total_ars
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by 1;
$$;
