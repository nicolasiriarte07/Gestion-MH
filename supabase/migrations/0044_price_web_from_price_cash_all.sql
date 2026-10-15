-- Recalcula P.Web para TODOS los productos de Inventario: P.Web = P.Contado
-- x 1.12, redondeado hacia abajo al peso (mismo criterio que la carga
-- inicial de 0037, pero ahora sin filtrar por "En Web" — pisa cualquier
-- P.Web que ya estuviera cargado).
update products
set price_web = floor(price_cash * 1.12);
