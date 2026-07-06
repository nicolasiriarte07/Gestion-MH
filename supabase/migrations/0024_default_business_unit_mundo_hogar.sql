-- Los productos sin unidad de negocio asignada (business_unit_id en
-- blanco) pasan a "MUNDO HOGAR" por defecto. No toca los que ya están
-- asignados a "EQUIPAMIENTOS MH" (o a cualquier otra unidad).
--
-- Seguro de ejecutar más de una vez: una vez que ya no quedan productos
-- sin asignar, no actualiza nada.

update products
set business_unit_id = (select id from business_units where name = 'MUNDO HOGAR')
where business_unit_id is null;
