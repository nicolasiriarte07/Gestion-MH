-- Velocidad de venta por producto, para las alertas de stock bajo en
-- Inventario: cuántas unidades se vendieron de cada producto en los
-- últimos N días. Solo cuenta líneas ya vinculadas a un producto del
-- catálogo (product_id no nulo, o sea confirmadas en Revisar
-- coincidencias o auto-matcheadas por código); las líneas pendientes no
-- se pueden atribuir con certeza a un producto puntual.
--
-- Seguro de ejecutar más de una vez.

create or replace function product_sales_velocity(days int)
returns table (
  product_id uuid,
  units_sold numeric
)
language sql
stable
as $$
  select
    product_id,
    coalesce(sum(quantity), 0) as units_sold
  from sale_items
  where product_id is not null
    and sale_date >= (current_date - (days || ' days')::interval)
  group by product_id;
$$;
