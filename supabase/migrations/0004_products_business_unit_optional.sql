-- La unidad de negocio deja de ser obligatoria al crear un producto: se
-- puede importar el Excel sin esa columna y completarla después a mano.
alter table products alter column business_unit_id drop not null;
