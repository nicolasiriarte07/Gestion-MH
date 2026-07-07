-- Más marcas nuevas para el inventario.
--
-- Seguro de ejecutar más de una vez.

insert into brands (name) values
  ('Springwall'),
  ('Atomlux'),
  ('Genius'),
  ('Moonki'),
  ('Sony'),
  ('Latapy'),
  ('Orbis'),
  ('Florencia')
on conflict (name) do nothing;
