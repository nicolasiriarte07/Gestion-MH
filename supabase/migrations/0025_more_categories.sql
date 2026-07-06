-- Categorías nuevas para el inventario.
--
-- Seguro de ejecutar más de una vez.

insert into categories (name) values
  ('Bicicletas'),
  ('Calefacción'),
  ('Ventilación'),
  ('Aires'),
  ('Filtros de agua'),
  ('Muebles'),
  ('Jardín'),
  ('Bazar'),
  ('Blanquería'),
  ('Colchones'),
  ('Termotanques'),
  ('Heladeras'),
  ('Freezers'),
  ('Lavarropas'),
  ('Secarropas'),
  ('TV')
on conflict (name) do nothing;
