-- Las ventas de Ecommerce de agosto se importaron antes de que existiera
-- la unidad de negocio "Ecommerce" (migración 0042), así que quedaron con
-- business_unit_id en null — por eso aparecían como "Sin asignar" en el
-- gráfico de torta ($284.000, el mismo total que el usuario reportó para
-- Ecommerce en agosto). Acá se les asigna la unidad de negocio correcta.
--
-- Acotado a ventas sin unidad de negocio Y de agosto 2026, para no tocar
-- otras ventas "Sin asignar" de otros períodos que puedan existir por
-- otro motivo. Seguro de ejecutar más de una vez (una vez reasignadas,
-- el where ya no las vuelve a encontrar).
update sale_items
set business_unit_id = (select id from business_units where lower(trim(name)) = 'ecommerce')
where business_unit_id is null
  and sale_date >= '2026-08-01'
  and sale_date < '2026-09-01';
