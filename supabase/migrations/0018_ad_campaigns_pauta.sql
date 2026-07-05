-- Rediseño de ad_campaigns para la pestaña PAUTA del módulo Marketing
-- (cronograma de campañas pagas, agrupado por mes de la fecha de inicio,
-- igual que la pestaña ORGÁNICO). La tabla original (de 0001_init.sql)
-- nunca tuvo una pantalla propia ni datos cargados, así que se recrea
-- directamente con las columnas nuevas: campaign_name (Campaña),
-- investment_ars (Inversión), reach (Alcance), start_date/end_date
-- (para calcular la Duración en días y agrupar por mes).
--
-- Seguro de ejecutar más de una vez.

drop table if exists ad_campaigns;

create table ad_campaigns (
  id             uuid primary key default gen_random_uuid(),
  campaign_name  text not null,
  investment_ars numeric(12,2) not null default 0,
  reach          integer not null default 0,
  start_date     date not null,
  end_date       date not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index ad_campaigns_start_date_idx on ad_campaigns(start_date);

create or replace trigger ad_campaigns_set_updated_at
  before update on ad_campaigns
  for each row execute function set_updated_at();

alter table ad_campaigns enable row level security;

drop policy if exists "authenticated_full_access" on ad_campaigns;
create policy "authenticated_full_access" on ad_campaigns
  for all to authenticated using (true) with check (true);
