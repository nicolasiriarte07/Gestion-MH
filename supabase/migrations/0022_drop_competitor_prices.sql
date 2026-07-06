-- El módulo "Precios de competencia" se retiró (la búsqueda automática
-- por nombre en los sitios de la competencia no funcionó de forma
-- confiable). Se eliminan sus tablas.
--
-- Seguro de ejecutar más de una vez.

drop table if exists product_competitor_prices;
drop table if exists competitor_sites;
