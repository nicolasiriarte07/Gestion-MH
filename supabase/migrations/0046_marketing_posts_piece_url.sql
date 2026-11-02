-- Columna "Pieza": link a la pieza gráfica (Canva) de cada acción. El
-- usuario carga el link a mano desde la tabla; el texto visible del
-- link siempre dice "Abrir en Canva" (se maneja en el frontend).
alter table marketing_posts
  add column if not exists piece_url text;
