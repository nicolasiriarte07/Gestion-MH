-- Más marcas nuevas para el inventario.
--
-- Seguro de ejecutar más de una vez.

insert into brands (name) values
  ('Solei'),
  ('Whirlpool'),
  ('Godeco'),
  ('Ross'),
  ('RCA'),
  ('LG')
on conflict (name) do nothing;
