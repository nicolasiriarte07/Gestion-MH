-- IVA de cada producto (21% o 10.5%), para poder calcular el Costo S/IVA
-- (costo sin impuestos) en la tabla de Inventario. Por defecto todo queda
-- en 21%, que es la alícuota general.
alter table products
  add column if not exists iva_rate numeric(4, 2) not null default 21;

-- Carga inicial por unidad de negocio: MUNDO HOGAR factura con IVA 21% y
-- EQUIPAMIENTOS MH con IVA 10.5% (bienes de capital/electrodomésticos).
-- Seguro de ejecutar más de una vez.
update products
set iva_rate = 21
where business_unit_id = (select id from business_units where name = 'MUNDO HOGAR');

update products
set iva_rate = 10.5
where business_unit_id = (select id from business_units where name = 'EQUIPAMIENTOS MH');
