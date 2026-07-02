-- El negocio maneja dos precios de venta distintos (contado y web), no
-- uno solo: renombramos sale_price a price_cash ("P. Contado") y agregamos
-- price_web ("P. Web").
alter table products rename column sale_price to price_cash;
alter table products add column price_web numeric(12,2) not null default 0;
