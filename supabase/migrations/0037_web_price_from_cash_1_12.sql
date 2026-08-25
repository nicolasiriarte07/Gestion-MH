-- Carga inicial de P. Web para los productos publicados en la web
-- (is_web = true): P. Web = P. Contado * 1.12, redondeado hacia abajo al
-- peso (ej. P.Contado $72.199 -> P.Web $80.862, no $80.863).
-- Solo toca productos con is_web = true; no modifica el resto.
update products
set price_web = floor(price_cash * 1.12)
where is_web = true;
