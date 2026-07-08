-- Más marcas nuevas para el inventario.
--
-- Seguro de ejecutar más de una vez.

insert into brands (name) values
  ('Briket'),
  ('Bambi'),
  ('Gafa'),
  ('Kohinoor'),
  ('Genoud'),
  ('Innova'),
  ('Lacar'),
  ('Usman'),
  ('Huitru')
on conflict (name) do nothing;
