-- Dos mejoras al dashboard de ventas:
-- - weekday_label: columna "Dia" del archivo (viene calculada por el
--   sistema de origen, ej. "viernes"), en vez de calcular el día de la
--   semana a partir de la fecha nosotros. sales_by_weekday ahora agrupa
--   por este texto tal cual (case-insensitive), con un orden lunes...
--   domingo; los valores que no matchean ningún día conocido van al final.
-- - sales_by_product: nueva función para el desglose "Por producto", que
--   agrupa por la descripción del artículo (columna Descripcion).
--
-- Seguro de ejecutar más de una vez.

alter table sale_items
  add column if not exists weekday_label text;

-- El tipo de retorno de sales_by_weekday cambia (antes "weekday int",
-- ahora "weekday_label text, sort_order int"), así que hay que borrarla
-- antes de recrearla.
drop function if exists sales_by_weekday(date, date);

create or replace function sales_by_weekday(from_date date, to_date date)
returns table (
  weekday_label text,
  sort_order int,
  total_ars numeric,
  total_usd numeric,
  line_count int
)
language sql
stable
as $$
  with normalized as (
    select
      coalesce(nullif(trim(lower(weekday_label)), ''), '') as label,
      subtotal_with_iva,
      amount_usd
    from sale_items
    where sale_date between from_date and to_date
  )
  select
    case when label = '' then 'Sin dato' else label end as weekday_label,
    case label
      when 'lunes' then 1
      when 'martes' then 2
      when 'miercoles' then 3
      when 'miércoles' then 3
      when 'jueves' then 4
      when 'viernes' then 5
      when 'sabado' then 6
      when 'sábado' then 6
      when 'domingo' then 7
      else 8
    end as sort_order,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    coalesce(sum(amount_usd), 0) as total_usd,
    count(*)::int as line_count
  from normalized
  group by label
  order by 2;
$$;

create or replace function sales_by_product(from_date date, to_date date)
returns table (
  product_description text,
  total_ars numeric,
  total_usd numeric,
  line_count int
)
language sql
stable
as $$
  select
    coalesce(nullif(trim(product_description_raw), ''), 'Sin descripción') as product_description,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    coalesce(sum(amount_usd), 0) as total_usd,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by total_ars desc;
$$;
