-- Módulo Clientes: buscar por nombre (columna Cliente de sale_items) y ver
-- el historial de compras de un cliente puntual.
--
-- Seguro de ejecutar más de una vez.

-- Busca clientes cuyo nombre contenga el término (case-insensitive),
-- agrupando todas sus líneas de venta. Se usa para la lista de
-- resultados de la búsqueda.
create or replace function search_customers(search_term text)
returns table (
  customer_name text,
  total_ars numeric,
  total_usd numeric,
  line_count int,
  first_sale_date date,
  last_sale_date date
)
language sql
stable
as $$
  select
    trim(customer_name) as customer_name,
    coalesce(sum(subtotal_with_iva), 0) as total_ars,
    coalesce(sum(amount_usd), 0) as total_usd,
    count(*)::int as line_count,
    min(sale_date) as first_sale_date,
    max(sale_date) as last_sale_date
  from sale_items
  where nullif(trim(customer_name), '') is not null
    and customer_name ilike '%' || search_term || '%'
  group by trim(customer_name)
  order by total_ars desc
  limit 25;
$$;

-- Historial completo de líneas de venta de un cliente puntual (nombre
-- exacto, tal como lo devuelve search_customers ya recortado con trim).
create or replace function customer_sales_history(customer_name_exact text)
returns table (
  id uuid,
  sale_date date,
  receipt_letter text,
  product_description_raw text,
  category_raw text,
  quantity numeric,
  subtotal_with_iva numeric,
  amount_usd numeric,
  payment_method text,
  business_unit_id uuid
)
language sql
stable
as $$
  select
    id, sale_date, receipt_letter, product_description_raw, category_raw,
    quantity, subtotal_with_iva, amount_usd, payment_method, business_unit_id
  from sale_items
  where trim(customer_name) = trim(customer_name_exact)
  order by sale_date desc, id
  limit 1000;
$$;
