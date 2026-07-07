-- Módulo Clientes: cuántos días pasan, en promedio (a nivel general, no
-- por cliente), entre la compra N y la N+1, para las primeras 6 compras
-- de cada cliente (1ra a 2da, 2da a 3ra, ..., 5ta a 6ta).
--
-- Seguro de ejecutar más de una vez.

create or replace function customer_recency_by_visit()
returns table (
  visit_number int,   -- 2 = transición de la compra 1 a la 2, etc.
  avg_days numeric,
  customers_count int
)
language sql
stable
as $$
  with customer_dates as (
    select
      customer_name,
      sale_date,
      row_number() over (partition by customer_name order by sale_date) as visit_number
    from (
      select distinct trim(customer_name) as customer_name, sale_date
      from sale_items
      where nullif(trim(customer_name), '') is not null
    ) distinct_dates
  ),
  gaps as (
    select
      customer_name,
      visit_number,
      sale_date - lag(sale_date) over (partition by customer_name order by sale_date) as gap_days
    from customer_dates
  )
  select
    visit_number,
    round(avg(gap_days), 1) as avg_days,
    count(*)::int as customers_count
  from gaps
  where visit_number between 2 and 6
    and gap_days is not null
  group by visit_number
  order by visit_number;
$$;
