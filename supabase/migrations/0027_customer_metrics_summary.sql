-- Módulo Clientes: métricas generales para mostrar arriba del buscador
-- (cantidad de clientes únicos, % que volvió a comprar, y cada cuántos
-- días compran en promedio).
--
-- Seguro de ejecutar más de una vez.

create or replace function customer_metrics_summary()
returns table (
  unique_customers int,
  repeat_purchase_pct numeric,
  avg_recency_days numeric
)
language sql
stable
as $$
  with customer_dates as (
    select trim(customer_name) as customer_name, sale_date
    from sale_items
    where nullif(trim(customer_name), '') is not null
    group by trim(customer_name), sale_date
  ),
  customer_gaps as (
    select
      customer_name,
      sale_date - lag(sale_date) over (partition by customer_name order by sale_date) as gap_days
    from customer_dates
  ),
  customer_stats as (
    select
      customer_name,
      count(*) as distinct_dates,
      avg(gap_days) as avg_gap_days
    from customer_gaps
    group by customer_name
  )
  select
    (select count(*) from customer_stats)::int,
    case
      when (select count(*) from customer_stats) = 0 then 0
      else round(
        100.0 * (select count(*) from customer_stats where distinct_dates > 1)
        / (select count(*) from customer_stats),
        1
      )
    end,
    coalesce(
      round((select avg(avg_gap_days) from customer_stats where avg_gap_days is not null), 1),
      0
    );
$$;
