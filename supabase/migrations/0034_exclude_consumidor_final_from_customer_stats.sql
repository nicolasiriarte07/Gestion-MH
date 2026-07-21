-- Las métricas generales de Clientes (resumen, recencia por compra,
-- ticket por compra y Pareto de facturación) agrupan las ventas por
-- nombre de cliente. "Consumidor Final" no es un cliente real: es el
-- nombre genérico que se usa para ventas sin cliente identificado, así
-- que junta a cientos de personas distintas bajo un solo nombre. Eso
-- inflaba artificialmente estas 4 métricas (aparecía como si fuera "un
-- cliente" enorme). Se excluye acá; el buscador de Clientes y su
-- historial de compras individual NO se tocan (ahí sigue teniendo
-- sentido poder buscarlo y ver ese detalle agrupado).
--
-- Seguro de ejecutar más de una vez.

create or replace function customer_metrics_summary()
returns table (
  unique_customers int,
  repeat_purchase_pct numeric,
  avg_recency_days numeric
)
language sql
stable
as $$
  with customer_dates as (
    select trim(customer_name) as customer_name, sale_date
    from sale_items
    where nullif(trim(customer_name), '') is not null
      and lower(trim(customer_name)) <> 'consumidor final'
    group by trim(customer_name), sale_date
  ),
  customer_gaps as (
    select
      customer_name,
      sale_date - lag(sale_date) over (partition by customer_name order by sale_date) as gap_days
    from customer_dates
  ),
  customer_stats as (
    select
      customer_name,
      count(*) as distinct_dates,
      avg(gap_days) as avg_gap_days
    from customer_gaps
    group by customer_name
  )
  select
    (select count(*) from customer_stats)::int,
    case
      when (select count(*) from customer_stats) = 0 then 0
      else round(
        100.0 * (select count(*) from customer_stats where distinct_dates > 1)
        / (select count(*) from customer_stats),
        1
      )
    end,
    coalesce(
      round((select avg(avg_gap_days) from customer_stats where avg_gap_days is not null), 1),
      0
    );
$$;

create or replace function customer_recency_by_visit()
returns table (
  visit_number int,
  avg_days numeric,
  customers_count int
)
language sql
stable
as $$
  with customer_dates as (
    select
      customer_name,
      sale_date,
      row_number() over (partition by customer_name order by sale_date) as visit_number
    from (
      select distinct trim(customer_name) as customer_name, sale_date
      from sale_items
      where nullif(trim(customer_name), '') is not null
        and lower(trim(customer_name)) <> 'consumidor final'
    ) distinct_dates
  ),
  gaps as (
    select
      customer_name,
      visit_number,
      sale_date - lag(sale_date) over (partition by customer_name order by sale_date) as gap_days
    from customer_dates
  )
  select
    visit_number,
    round(avg(gap_days), 1) as avg_days,
    count(*)::int as customers_count
  from gaps
  where visit_number between 2 and 6
    and gap_days is not null
  group by visit_number
  order by visit_number;
$$;

create or replace function customer_avg_ticket_usd_by_visit()
returns table (
  visit_number int,
  avg_ticket_usd numeric,
  customers_count int
)
language sql
stable
as $$
  with visit_totals as (
    select
      trim(customer_name) as customer_name,
      sale_date,
      sum(amount_usd) as ticket_usd
    from sale_items
    where nullif(trim(customer_name), '') is not null
      and lower(trim(customer_name)) <> 'consumidor final'
    group by trim(customer_name), sale_date
  ),
  numbered_visits as (
    select
      ticket_usd,
      row_number() over (partition by customer_name order by sale_date) as visit_number
    from visit_totals
  )
  select
    visit_number,
    round(avg(ticket_usd), 1) as avg_ticket_usd,
    count(*)::int as customers_count
  from numbered_visits
  where visit_number between 1 and 5
  group by visit_number
  order by visit_number;
$$;

create or replace function customer_revenue_pareto()
returns table (
  decile int,
  cumulative_pct numeric,
  customers_count int
)
language sql
stable
as $$
  with customer_totals as (
    select trim(customer_name) as customer_name, sum(subtotal_with_iva) as total_ars
    from sale_items
    where nullif(trim(customer_name), '') is not null
      and lower(trim(customer_name)) <> 'consumidor final'
    group by trim(customer_name)
  ),
  ranked as (
    select
      total_ars,
      row_number() over (order by total_ars desc) as rn,
      sum(total_ars) over (order by total_ars desc) as cum_revenue
    from customer_totals
  ),
  totals as (
    select count(*)::int as total_customers, sum(total_ars) as grand_total
    from customer_totals
  ),
  deciles as (
    select
      gs as decile,
      least(t.total_customers, ceil(t.total_customers * gs / 100.0)::int) as cutoff_rank
    from generate_series(10, 100, 10) as gs
    cross join totals t
    where t.total_customers > 0
  )
  select
    d.decile,
    round(100.0 * r.cum_revenue / t.grand_total, 1) as cumulative_pct,
    d.cutoff_rank as customers_count
  from deciles d
  cross join totals t
  join ranked r on r.rn = d.cutoff_rank
  order by d.decile;
$$;
