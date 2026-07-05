-- Columna Descripción para el módulo Marketing: texto libre más largo
-- que el Concepto, para elaborar el detalle de la acción.
--
-- Seguro de ejecutar más de una vez.

alter table marketing_posts
  add column if not exists description text;
