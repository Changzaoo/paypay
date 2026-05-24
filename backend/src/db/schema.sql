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

create table if not exists internal_threads (
  id uuid primary key default gen_random_uuid(),
  provider text,
  channel_ref text unique,
  display_name text,
  address text,
  last_text text,
  last_event_at timestamptz default now(),
  unread_count int default 0,
  state text default 'open',
  tags jsonb default '[]'::jsonb,
  raw jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists internal_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references internal_threads(id) on delete cascade,
  provider text,
  provider_ref text unique,
  direction text,
  kind text,
  body text,
  media_url text,
  status text,
  payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists internal_orders_input_provider_id_uq on internal_orders(input_provider_id) where input_provider_id is not null;
create index if not exists internal_orders_operator_idx on internal_orders(operator_id);
create index if not exists internal_orders_status_idx on internal_orders(status);
create index if not exists internal_orders_created_at_idx on internal_orders(created_at desc);
create index if not exists internal_jobs_status_run_after_idx on internal_jobs(status, run_after);
create index if not exists internal_events_order_idx on internal_events(order_id);
create index if not exists internal_threads_last_event_idx on internal_threads(last_event_at desc);
create index if not exists internal_messages_thread_idx on internal_messages(thread_id, created_at);

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

drop trigger if exists internal_threads_updated_at on internal_threads;
create trigger internal_threads_updated_at
before update on internal_threads
for each row execute function set_updated_at();

drop trigger if exists internal_messages_updated_at on internal_messages;
create trigger internal_messages_updated_at
before update on internal_messages
for each row execute function set_updated_at();

alter table internal_orders enable row level security;
alter table internal_events enable row level security;
alter table internal_jobs enable row level security;
alter table internal_settings enable row level security;
alter table internal_threads enable row level security;
alter table internal_messages enable row level security;

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

drop policy if exists internal_threads_select_none on internal_threads;
create policy internal_threads_select_none on internal_threads
for select
to authenticated
using (false);

drop policy if exists internal_messages_select_none on internal_messages;
create policy internal_messages_select_none on internal_messages
for select
to authenticated
using (false);

insert into internal_settings(key, value)
values ('intermediate_mode', '{"mode":"manual"}'::jsonb)
on conflict (key) do nothing;

insert into internal_settings(key, value)
values ('enabled_networks', '{"networks":["bitcoin","ethereum","arbitrum","base","polygon","bsc"]}'::jsonb)
on conflict (key) do nothing;

create table if not exists users_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  email text unique,
  role text default 'operator',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists wallet_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists chain_configs (
  id uuid primary key default gen_random_uuid(),
  chain_key text not null unique,
  chain_id int not null unique,
  name text not null,
  rpc_url text not null,
  explorer_url text,
  native_symbol text not null,
  native_decimals int default 18,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists token_configs (
  id uuid primary key default gen_random_uuid(),
  chain_id int not null references chain_configs(chain_id),
  symbol text not null,
  name text not null,
  contract_address text,
  decimals int default 18,
  is_native boolean default false,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(chain_id, symbol)
);

create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  chain_id int not null references chain_configs(chain_id),
  address text not null,
  purpose text not null,
  status text default 'pending',
  group_id uuid references wallet_groups(id),
  daily_limit numeric default 0,
  expected_balance numeric default 0,
  tags jsonb default '[]'::jsonb,
  key_ref text,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(chain_id, address)
);

create table if not exists transfer_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid,
  requester_email text,
  source_wallet_id uuid references wallets(id),
  destination_wallet_id uuid references wallets(id),
  chain_id int references chain_configs(chain_id),
  token_id uuid references token_configs(id),
  token_symbol text,
  amount numeric not null,
  reason text not null,
  status text default 'pending_approval',
  approved_by uuid,
  approved_at timestamptz,
  risk_result jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists transfer_transactions (
  id uuid primary key default gen_random_uuid(),
  transfer_request_id uuid references transfer_requests(id) on delete cascade,
  chain_id int references chain_configs(chain_id),
  token_id uuid references token_configs(id),
  from_wallet_id uuid references wallets(id),
  to_wallet_id uuid references wallets(id),
  amount numeric not null,
  status text default 'queued',
  nonce bigint,
  tx_hash text,
  fee_amount numeric,
  attempts int default 0,
  max_attempts int default 3,
  error_message text,
  raw jsonb,
  sent_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists bridge_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid,
  requester_email text,
  source_wallet_id uuid references wallets(id),
  destination_wallet_id uuid references wallets(id),
  source_chain_id int references chain_configs(chain_id),
  destination_chain_id int references chain_configs(chain_id),
  source_token_id uuid references token_configs(id),
  destination_token_id uuid references token_configs(id),
  source_token_symbol text,
  destination_token_symbol text,
  amount numeric not null,
  provider text not null,
  quote jsonb,
  fee_estimate numeric,
  slippage_bps int default 50,
  reason text not null,
  status text default 'pending_approval',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists bridge_steps (
  id uuid primary key default gen_random_uuid(),
  bridge_request_id uuid references bridge_requests(id) on delete cascade,
  step_type text,
  status text,
  tx_hash text,
  fee_amount numeric,
  payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  entity_type text,
  entity_id uuid,
  decision text default 'pending',
  note text,
  approver_id uuid,
  approver_email text,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  actor_role text,
  action text,
  entity_type text,
  entity_id uuid,
  ip_address text,
  payload jsonb,
  created_at timestamptz default now()
);

create table if not exists risk_rules (
  id uuid primary key default gen_random_uuid(),
  rule_type text not null,
  chain_id int references chain_configs(chain_id),
  value text not null,
  reason text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists users_profile_user_idx on users_profile(user_id);
create index if not exists wallets_chain_status_idx on wallets(chain_id, status);
create index if not exists wallets_address_idx on wallets(address);
create index if not exists transfer_requests_status_idx on transfer_requests(status, created_at desc);
create index if not exists transfer_transactions_status_idx on transfer_transactions(status, created_at);
create index if not exists transfer_transactions_hash_idx on transfer_transactions(tx_hash);
create index if not exists bridge_requests_status_idx on bridge_requests(status, created_at desc);
create index if not exists bridge_steps_request_idx on bridge_steps(bridge_request_id, created_at);
create index if not exists approvals_entity_idx on approvals(entity_type, entity_id, created_at desc);
create index if not exists audit_logs_created_idx on audit_logs(created_at desc);
create index if not exists audit_logs_entity_idx on audit_logs(entity_type, entity_id);
create index if not exists risk_rules_type_idx on risk_rules(rule_type, status);

drop trigger if exists users_profile_updated_at on users_profile;
create trigger users_profile_updated_at
before update on users_profile
for each row execute function set_updated_at();

drop trigger if exists wallet_groups_updated_at on wallet_groups;
create trigger wallet_groups_updated_at
before update on wallet_groups
for each row execute function set_updated_at();

drop trigger if exists chain_configs_updated_at on chain_configs;
create trigger chain_configs_updated_at
before update on chain_configs
for each row execute function set_updated_at();

drop trigger if exists token_configs_updated_at on token_configs;
create trigger token_configs_updated_at
before update on token_configs
for each row execute function set_updated_at();

drop trigger if exists wallets_updated_at on wallets;
create trigger wallets_updated_at
before update on wallets
for each row execute function set_updated_at();

drop trigger if exists transfer_requests_updated_at on transfer_requests;
create trigger transfer_requests_updated_at
before update on transfer_requests
for each row execute function set_updated_at();

drop trigger if exists transfer_transactions_updated_at on transfer_transactions;
create trigger transfer_transactions_updated_at
before update on transfer_transactions
for each row execute function set_updated_at();

drop trigger if exists bridge_requests_updated_at on bridge_requests;
create trigger bridge_requests_updated_at
before update on bridge_requests
for each row execute function set_updated_at();

drop trigger if exists bridge_steps_updated_at on bridge_steps;
create trigger bridge_steps_updated_at
before update on bridge_steps
for each row execute function set_updated_at();

drop trigger if exists risk_rules_updated_at on risk_rules;
create trigger risk_rules_updated_at
before update on risk_rules
for each row execute function set_updated_at();

alter table users_profile enable row level security;
alter table wallet_groups enable row level security;
alter table chain_configs enable row level security;
alter table token_configs enable row level security;
alter table wallets enable row level security;
alter table transfer_requests enable row level security;
alter table transfer_transactions enable row level security;
alter table bridge_requests enable row level security;
alter table bridge_steps enable row level security;
alter table approvals enable row level security;
alter table audit_logs enable row level security;
alter table risk_rules enable row level security;

drop policy if exists users_profile_select_own on users_profile;
create policy users_profile_select_own on users_profile
for select
to authenticated
using (user_id = auth.uid());

insert into wallet_groups(name, description)
values ('Principal', 'Operacao interna')
on conflict (name) do nothing;
