-- Más marcas nuevas para el inventario.
--
-- Seguro de ejecutar más de una vez.

insert into brands (name) values
  ('Casablanca'),
  ('CTZ'),
  ('Las Calas'),
  ('Braun'),
  ('Surrey'),
  ('Midea'),
  ('Kelvinator'),
  ('Neorelax'),
  ('Solreal'),
  ('Piero'),
  ('Froggy'),
  ('Voss'),
  ('Delos'),
  ('Otten'),
  ('Fisher'),
  ('Gravity'),
  ('Olmo'),
  ('Magiclick'),
  ('TST'),
  ('Imperial'),
  ('Escorial'),
  ('Drean'),
  ('Longvie'),
  ('Morelli'),
  ('Volcan'),
  ('Dibra'),
  ('Moretti'),
  ('Forza'),
  ('Hidrolit'),
  ('Patrick'),
  ('Piro'),
  ('Richezze')
on conflict (name) do nothing;
