-- Categorías y subcategorías del catálogo de MUNDO HOGAR.
-- Seguro de ejecutar más de una vez (no duplica si ya existen).

insert into categories (name) values
  ('Pequeños Electrodomésticos'),
  ('TV'),
  ('Cocina'),
  ('Cuidado Personal'),
  ('Audio'),
  ('Equipamiento Comercial'),
  ('Limpieza'),
  ('Salud'),
  ('Tecnología'),
  ('Maquinas de coser'),
  ('Combos'),
  ('Bazar')
on conflict (name) do nothing;

insert into subcategories (category_id, name)
select c.id, s.name
from (values
  ('Pequeños Electrodomésticos', 'Balanzas'),
  ('Pequeños Electrodomésticos', 'Batidoras'),
  ('Pequeños Electrodomésticos', 'Cafeteras'),
  ('Pequeños Electrodomésticos', 'Exprimidoras'),
  ('Pequeños Electrodomésticos', 'Freidoras'),
  ('Pequeños Electrodomésticos', 'Licuadoras'),
  ('Pequeños Electrodomésticos', 'Minipimers'),
  ('Pequeños Electrodomésticos', 'Procesadoras'),
  ('Pequeños Electrodomésticos', 'Pavas'),
  ('Pequeños Electrodomésticos', 'Ralladores'),
  ('Pequeños Electrodomésticos', 'Sandwicheras'),
  ('Pequeños Electrodomésticos', 'Tostadoras'),
  ('Pequeños Electrodomésticos', 'Vaporeras'),
  ('Cocina', 'Hornos eléctricos'),
  ('Cocina', 'Microondas'),
  ('Cuidado Personal', 'Afeitadoras'),
  ('Cuidado Personal', 'Cortapelos'),
  ('Cuidado Personal', 'Depiladoras'),
  ('Cuidado Personal', 'Planchitas'),
  ('Cuidado Personal', 'Secadores'),
  ('Audio', 'Auriculares'),
  ('Audio', 'Parlantes'),
  ('Audio', 'Radios'),
  ('Audio', 'Stereos'),
  ('Equipamiento Comercial', 'Balanzas'),
  ('Equipamiento Comercial', 'Cortadoras'),
  ('Equipamiento Comercial', 'Envasadoras'),
  ('Equipamiento Comercial', 'Termoselladoras'),
  ('Limpieza', 'Aspiradoras'),
  ('Limpieza', 'Aspiradora Robot'),
  ('Limpieza', 'Planchas'),
  ('Salud', 'Nebulizadores'),
  ('Salud', 'Tensiometro'),
  ('Tecnología', 'Celulares'),
  ('Tecnología', 'Monitores'),
  ('Tecnología', 'Notebooks'),
  ('Tecnología', 'Smartwatch'),
  ('Tecnología', 'Tablets')
) as s(category_name, name)
join categories c on c.name = s.category_name
on conflict (category_id, name) do nothing;
