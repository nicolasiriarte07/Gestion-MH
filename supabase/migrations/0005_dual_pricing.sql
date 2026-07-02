-- El negocio maneja dos precios de venta distintos (contado y web), no
-- uno solo: renombramos sale_price a price_cash ("P. Contado") y agregamos
-- price_web ("P. Web").
--
-- Seguro de ejecutar más de una vez.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'products' and column_name = 'sale_price'
  ) and not exists (
    select 1 from information_schema.columns
    where table_name = 'products' and column_name = 'price_cash'
  ) then
    alter table products rename column sale_price to price_cash;
  end if;
end $$;

alter table products add column if not exists price_web numeric(12,2) not null default 0;
