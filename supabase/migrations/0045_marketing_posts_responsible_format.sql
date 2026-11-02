-- Nuevas columnas para la vista Lista del módulo de Marketing:
-- quién está a cargo de la acción y en qué formato se publica.
alter table marketing_posts
  add column if not exists responsible text check (responsible in ('Nico', 'Jesi', 'Axel')),
  add column if not exists format text check (format in ('Reel', 'Historia', 'Feed'));
