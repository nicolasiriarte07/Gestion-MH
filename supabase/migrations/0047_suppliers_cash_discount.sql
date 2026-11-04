-- Descuento de contado (%) que ofrece el proveedor, distinto del
-- descuento habitual general que ya existía.
alter table suppliers
  add column if not exists cash_discount numeric;
