-- Nueva unidad de negocio "Ecommerce", para las ventas online que el
-- usuario viene cargando aparte de MUNDO HOGAR y EQUIPAMIENTOS MH. Una vez
-- creada, el importador de Ventas (/ventas/import) va a reconocer
-- "Ecommerce" en la columna de unidad de negocio del archivo y asignarla
-- sola (matchea por nombre, sin distinguir mayúsculas/minúsculas) — así
-- aparece con ese nombre en el gráfico de torta "Ventas por unidad de
-- negocio" de Inicio, en vez de caer en "Sin asignar".
--
-- Seguro de ejecutar más de una vez.
insert into business_units (name)
select 'Ecommerce'
where not exists (
  select 1 from business_units where lower(trim(name)) = 'ecommerce'
);
