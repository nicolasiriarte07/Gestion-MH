-- Cuenta corriente del CRM Equipamientos: ventas financiadas en cuotas
-- (entrega + N cuotas con fecha de vencimiento propia), para llevar las
-- cuentas a cobrar de cada cliente en formato calendario.
create table crm_installment_sales (
  id                      uuid primary key default gen_random_uuid(),
  client_name             text not null,
  product                 text not null,
  sale_date               date not null,
  down_payment            numeric(12,2) not null default 0,
  installment_frequency   text not null
    check (installment_frequency in ('diaria', 'semanal', 'mensual')),
  installment_amount      numeric(12,2) not null default 0,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Una fila por cuota: permite marcar cada vencimiento como cobrado por
-- separado y mostrarlas en el calendario en su fecha real.
create table crm_installments (
  id                  uuid primary key default gen_random_uuid(),
  sale_id             uuid not null references crm_installment_sales(id) on delete cascade,
  installment_number  integer not null,
  due_date            date not null,
  amount              numeric(12,2) not null,
  paid                boolean not null default false,
  paid_date           date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index crm_installment_sales_client_name_idx on crm_installment_sales(client_name);
create index crm_installments_sale_id_idx on crm_installments(sale_id);
create index crm_installments_due_date_idx on crm_installments(due_date);

create or replace trigger crm_installment_sales_set_updated_at
  before update on crm_installment_sales
  for each row execute function set_updated_at();

create or replace trigger crm_installments_set_updated_at
  before update on crm_installments
  for each row execute function set_updated_at();

alter table crm_installment_sales enable row level security;
alter table crm_installments enable row level security;

drop policy if exists "authenticated_full_access" on crm_installment_sales;
create policy "authenticated_full_access" on crm_installment_sales
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_full_access" on crm_installments;
create policy "authenticated_full_access" on crm_installments
  for all to authenticated using (true) with check (true);
