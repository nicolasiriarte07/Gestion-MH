-- Marcas nuevas para el inventario.
--
-- Seguro de ejecutar más de una vez.

insert into brands (name) values
  ('Philco'),
  ('Dekkin'),
  ('JBL'),
  ('Olmo'),
  ('Kodak')
on conflict (name) do nothing;
