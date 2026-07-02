-- Ajustes al dashboard de ventas:
-- - amount_usd: columna "Monto_con_IVA_usd" del archivo, para poder ver
--   la facturación en dólares además de en pesos.
-- - Las funciones de agregación ahora devuelven total_ars, total_usd y
--   line_count juntos (antes solo ars), y sales_summary suma clientes
--   únicos. "Cantidad de ventas" pasa a ser un conteo de líneas del
--   período (line_count), no de comprobantes distintos: receipt_number
--   no siempre viene cargado y daba 0.
-- - sales_by_weekday: nueva función para el gráfico de ventas por día de
--   la semana (1 = lunes ... 7 = domingo, ISO).
--
-- Seguro de ejecutar más de una vez.

alter table sale_items
  add column if not exists amount_usd numeric(12,2);

-- El tipo de retorno de estas funciones cambia (se agrega total_usd, y
-- sales_summary reemplaza receipt_count por line_count/unique_customers),
-- así que hay que borrarlas antes de recrearlas: Postgres no permite
-- cambiar las columnas de salida de una función con CREATE OR REPLACE.
drop function if exists sales_summary(date, date);
drop function if exists sales_by_receipt_letter(date, date);
drop function if exists sales_by_business_unit(date, date);
drop function if exists sales_by_category(date, date);
drop function if exists sales_by_payment_method(date, date);
drop function if exists sales_timeseries(date, date, text);

create or replace function sales_summary(from_date date, to_date date)
returns table (
  total_ars numeric,
  total_usd numeric,
  line_count int,
  unit_count numeric,
  unique_customers int
)
language sql
stable
as $$
  select
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    coalesce(sum(amount_usd), 0) as total_usd,
    count(*)::int as line_count,
    coalesce(sum(quantity), 0) as unit_count,
    count(distinct nullif(trim(customer_name), ''))::int as unique_customers
  from sale_items
  where sale_date between from_date and to_date;
$$;

create or replace function sales_by_receipt_letter(from_date date, to_date date)
returns table (receipt_letter text, total_ars numeric, total_usd numeric, line_count int)
language sql
stable
as $$
  select
    coalesce(nullif(receipt_letter, ''), 'Sin dato') as receipt_letter,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    coalesce(sum(amount_usd), 0) as total_usd,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by total_ars desc;
$$;

create or replace function sales_by_business_unit(from_date date, to_date date)
returns table (business_unit_id uuid, total_ars numeric, total_usd numeric, line_count int)
language sql
stable
as $$
  select
    business_unit_id,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    coalesce(sum(amount_usd), 0) as total_usd,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by total_ars desc;
$$;

create or replace function sales_by_category(from_date date, to_date date)
returns table (category_raw text, total_ars numeric, total_usd numeric, line_count int)
language sql
stable
as $$
  select
    coalesce(nullif(category_raw, ''), 'Sin categoría') as category_raw,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    coalesce(sum(amount_usd), 0) as total_usd,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by total_ars desc;
$$;

create or replace function sales_by_payment_method(from_date date, to_date date)
returns table (payment_method text, total_ars numeric, total_usd numeric, line_count int)
language sql
stable
as $$
  select
    coalesce(nullif(payment_method, ''), 'Sin dato') as payment_method,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    coalesce(sum(amount_usd), 0) as total_usd,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by total_ars desc;
$$;

-- bucket: 'day' | 'week' | 'month'
create or replace function sales_timeseries(from_date date, to_date date, bucket text)
returns table (bucket_start date, total_ars numeric, total_usd numeric, line_count int)
language sql
stable
as $$
  select
    date_trunc(bucket, sale_date)::date as bucket_start,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    coalesce(sum(amount_usd), 0) as total_usd,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by 1;
$$;

-- weekday: 1 = lunes ... 7 = domingo (ISO 8601, extract(isodow ...))
create or replace function sales_by_weekday(from_date date, to_date date)
returns table (weekday int, total_ars numeric, total_usd numeric, line_count int)
language sql
stable
as $$
  select
    extract(isodow from sale_date)::int as weekday,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    coalesce(sum(amount_usd), 0) as total_usd,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by 1;
$$;
