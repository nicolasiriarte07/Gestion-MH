-- Módulo Clientes: distribución de Pareto de facturación. Para cada
-- decil de clientes (10%, 20%, ..., 100%, ordenados de mayor a menor
-- facturación) devuelve qué % acumulado de la facturación total
-- representan.
--
-- Seguro de ejecutar más de una vez.

create or replace function customer_revenue_pareto()
returns table (
  decile int,
  cumulative_pct numeric,
  customers_count int
)
language sql
stable
as $$
  with customer_totals as (
    select trim(customer_name) as customer_name, sum(subtotal_with_iva) as total_ars
    from sale_items
    where nullif(trim(customer_name), '') is not null
    group by trim(customer_name)
  ),
  ranked as (
    select
      total_ars,
      row_number() over (order by total_ars desc) as rn,
      sum(total_ars) over (order by total_ars desc) as cum_revenue
    from customer_totals
  ),
  totals as (
    select count(*)::int as total_customers, sum(total_ars) as grand_total
    from customer_totals
  ),
  deciles as (
    select
      gs as decile,
      least(t.total_customers, ceil(t.total_customers * gs / 100.0)::int) as cutoff_rank
    from generate_series(10, 100, 10) as gs
    cross join totals t
    where t.total_customers > 0
  )
  select
    d.decile,
    round(100.0 * r.cum_revenue / t.grand_total, 1) as cumulative_pct,
    d.cutoff_rank as customers_count
  from deciles d
  cross join totals t
  join ranked r on r.rn = d.cutoff_rank
  order by d.decile;
$$;
