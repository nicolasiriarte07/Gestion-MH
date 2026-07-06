-- Publicado: si la acción de comunicación ya se publicó o no, distinto
-- de Pautado (is_scheduled), que indica si tiene pauta/inversión paga.
alter table marketing_posts
  add column if not exists is_published boolean not null default false;
