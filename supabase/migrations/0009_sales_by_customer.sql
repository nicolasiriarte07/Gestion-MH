-- Nueva función para el ranking "Top 10 clientes" del dashboard de
-- ventas, agrupando por la columna Cliente (customer_name).
--
-- Seguro de ejecutar más de una vez.

create or replace function sales_by_customer(from_date date, to_date date)
returns table (
  customer_name text,
  total_ars numeric,
  total_usd numeric,
  line_count int
)
language sql
stable
as $$
  select
    coalesce(nullif(trim(customer_name), ''), 'Sin dato') as customer_name,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    coalesce(sum(amount_usd), 0) as total_usd,
    count(*)::int as line_count
  from sale_items
  where sale_date between from_date and to_date
  group by 1
  order by total_ars desc;
$$;
