-- Completa P. Web para los productos que no lo tienen cargado (P. Web en
-- $0), calculándolo como P. Contado × 1,12. No toca productos que ya
-- tienen un P. Web cargado, ni productos sin P. Contado cargado (no hay
-- nada de qué calcularlo).
--
-- Seguro de ejecutar más de una vez: una vez completados, no queda
-- ninguno en $0 para volver a tocar.

update products
set price_web = round(price_cash * 1.12)
where price_web = 0
  and price_cash > 0;
