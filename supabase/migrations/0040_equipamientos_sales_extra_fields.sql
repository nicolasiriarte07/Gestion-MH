-- La data real de la app vieja (tabla "sales" en Vercel) trae dos columnas
-- que "Ventas MH Equipamientos" todavía no tenía: cuántas semanas ya pagó
-- el cliente (ventas en cuotas) y un comentario libre (ej. "Prox
-- vencimiento: 25-1"). Se agregan para no perder esos datos al importar el
-- historial.
alter table equipamientos_sales
  add column if not exists semanas_pagadas integer not null default 0,
  add column if not exists comentario text;
