-- Más marcas nuevas para el inventario.
--
-- Seguro de ejecutar más de una vez.

insert into brands (name) values
  ('Santini'),
  ('Kretz'),
  ('Westinghouse'),
  ('Segva'),
  ('Turboblender'),
  ('Solei'),
  ('Kioto'),
  ('Harrison'),
  ('Daihatsu'),
  ('Kelyx'),
  ('LG'),
  ('Peabody'),
  ('Grow'),
  ('Moulinex')
on conflict (name) do nothing;
