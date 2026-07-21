-- TOP clientes por facturación, para mostrar como tabla al costado del
-- gráfico de Pareto en Clientes. Misma base que customer_revenue_pareto()
-- (excluye "Consumidor Final" por ser un nombre genérico, no un cliente
-- real).
--
-- Seguro de ejecutar más de una vez.

create or replace function customer_revenue_top(limit_count int default 15)
returns table (
  rank int,
  customer_name text,
  total_ars numeric,
  pct_of_total numeric
)
language sql
stable
as $$
  with customer_totals as (
    select trim(customer_name) as customer_name, sum(subtotal_with_iva) as total_ars
    from sale_items
    where nullif(trim(customer_name), '') is not null
      and lower(trim(customer_name)) <> 'consumidor final'
    group by trim(customer_name)
  ),
  totals as (
    select sum(total_ars) as grand_total from customer_totals
  )
  select
    row_number() over (order by ct.total_ars desc)::int as rank,
    ct.customer_name,
    ct.total_ars,
    round(100.0 * ct.total_ars / t.grand_total, 1) as pct_of_total
  from customer_totals ct
  cross join totals t
  where t.grand_total > 0
  order by ct.total_ars desc
  limit limit_count;
$$;
