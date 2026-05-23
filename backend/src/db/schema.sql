create extension if not exists pgcrypto;

create table if not exists internal_orders (
  id uuid primary key default gen_random_uuid(),
  public_id text unique,
  operator_id uuid,
  operator_ip text,
  external_ref text unique,
  input_amount_brl numeric,
  input_status text,
  input_provider_id text,
  input_qr_code text,
  input_qr_image_url text,
  input_expires_at timestamptz,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_document text,
  intermediate_expected_amount numeric,
  intermediate_received_amount numeric,
  intermediate_txid text,
  intermediate_status text,
  intermediate_note text,
  settlement_provider_id text,
  settlement_status text,
  settlement_deposit_address text,
  settlement_deposit_amount numeric,
  settlement_settle_amount numeric,
  settlement_output_asset text,
  settlement_output_network text,
  settlement_output_address text,
  settlement_output_txid text,
  refund_address text,
  status text,
  error_message text,
  raw_input jsonb,
  raw_intermediate jsonb,
  raw_settlement jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists internal_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references internal_orders(id) on delete cascade,
  event_type text,
  source text,
  payload jsonb,
  event_hash text unique,
  created_at timestamptz default now()
);

create table if not exists internal_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references internal_orders(id) on delete cascade,
  job_type text,
  status text,
  attempts int default 0,
  max_attempts int default 5,
  run_after timestamptz default now(),
  locked_at timestamptz,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists internal_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique,
  value jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists internal_orders_input_provider_id_uq on internal_orders(input_provider_id) where input_provider_id is not null;
create index if not exists internal_orders_operator_idx on internal_orders(operator_id);
create index if not exists internal_orders_status_idx on internal_orders(status);
create index if not exists internal_orders_created_at_idx on internal_orders(created_at desc);
create index if not exists internal_jobs_status_run_after_idx on internal_jobs(status, run_after);
create index if not exists internal_events_order_idx on internal_events(order_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists internal_orders_updated_at on internal_orders;
create trigger internal_orders_updated_at
before update on internal_orders
for each row execute function set_updated_at();

drop trigger if exists internal_jobs_updated_at on internal_jobs;
create trigger internal_jobs_updated_at
before update on internal_jobs
for each row execute function set_updated_at();

drop trigger if exists internal_settings_updated_at on internal_settings;
create trigger internal_settings_updated_at
before update on internal_settings
for each row execute function set_updated_at();

alter table internal_orders enable row level security;
alter table internal_events enable row level security;
alter table internal_jobs enable row level security;
alter table internal_settings enable row level security;

drop policy if exists internal_orders_select_own on internal_orders;
create policy internal_orders_select_own on internal_orders
for select
to authenticated
using (operator_id = auth.uid());

drop policy if exists internal_events_select_own on internal_events;
create policy internal_events_select_own on internal_events
for select
to authenticated
using (
  exists (
    select 1
    from internal_orders
    where internal_orders.id = internal_events.order_id
    and internal_orders.operator_id = auth.uid()
  )
);

drop policy if exists internal_settings_select_none on internal_settings;
create policy internal_settings_select_none on internal_settings
for select
to authenticated
using (false);

insert into internal_settings(key, value)
values ('intermediate_mode', '{"mode":"manual"}'::jsonb)
on conflict (key) do nothing;

insert into internal_settings(key, value)
values ('enabled_networks', '{"networks":["bitcoin","ethereum","arbitrum","base","polygon","bsc"]}'::jsonb)
on conflict (key) do nothing;
