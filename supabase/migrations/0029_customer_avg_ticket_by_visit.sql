-- Módulo Clientes: ticket promedio en USD de la 1ra, 2da, 3ra, 4ta y 5ta
-- compra de cada cliente, a nivel general (promediado entre todos los
-- clientes que llegaron a esa compra). El "ticket" de una compra es la
-- suma de todas las líneas de venta de ese cliente en esa fecha (una
-- visita puede tener varios productos).
--
-- Seguro de ejecutar más de una vez.

create or replace function customer_avg_ticket_usd_by_visit()
returns table (
  visit_number int,
  avg_ticket_usd numeric,
  customers_count int
)
language sql
stable
as $$
  with visit_totals as (
    select
      trim(customer_name) as customer_name,
      sale_date,
      sum(amount_usd) as ticket_usd
    from sale_items
    where nullif(trim(customer_name), '') is not null
    group by trim(customer_name), sale_date
  ),
  numbered_visits as (
    select
      ticket_usd,
      row_number() over (partition by customer_name order by sale_date) as visit_number
    from visit_totals
  )
  select
    visit_number,
    round(avg(ticket_usd), 1) as avg_ticket_usd,
    count(*)::int as customers_count
  from numbered_visits
  where visit_number between 1 and 5
  group by visit_number
  order by visit_number;
$$;
