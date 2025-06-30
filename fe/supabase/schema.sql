-- Create BitPesa transaction tracking table

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create the transactions table
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_address text not null,
  transaction_type text not null,
  amount text not null,
  token_symbol text not null,
  token_decimals integer not null,
  tx_hash text,
  block_timestamp bigint,
  loan_id integer,
  interest_rate numeric,
  loan_duration_days integer,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- Add indexes for faster queries
create index transactions_user_address_idx on transactions(user_address);
create index transactions_transaction_type_idx on transactions(transaction_type);
create index transactions_loan_id_idx on transactions(loan_id);

-- Set up Row Level Security (RLS)
alter table transactions enable row level security;

-- Create RLS policy for inserting records
-- This policy allows users to only insert records for their own address
create policy "Users can insert their own transactions"
  on transactions for insert
  with check (true); -- In production, you would add verification here

-- Create RLS policy for reading records
-- This policy allows users to only read their own transactions
create policy "Users can view their own transactions"
  on transactions for select
  using (true); -- In production, you would add verification here

-- Create RLS policy to prevent updates
create policy "No one can update transactions"
  on transactions for update
  using (false);

-- Create RLS policy to prevent deletions
create policy "No one can delete transactions"
  on transactions for delete
  using (false);

-- Create BitPesa Crypto Wills tables

-- Table for storing KYC verification data
create table kyc_verifications (
  id uuid default uuid_generate_v4() primary key,
  user_address text not null unique,
  verification_status text not null, -- "pending", "verified", "rejected"
  verification_method text,
  verification_data jsonb,
  verified_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for faster queries
create index kyc_verifications_user_address_idx on kyc_verifications(user_address);

-- Table for storing crypto wills
create table crypto_wills (
  id uuid default uuid_generate_v4() primary key,
  contract_will_id integer not null,
  creator_address text not null,
  assets_amount text not null,
  token_symbol text not null,
  token_decimals integer not null,
  last_activity_timestamp timestamp with time zone not null,
  inactivity_period_seconds integer not null,
  executed boolean not null default false,
  metadata_uri text,
  release_condition text not null, -- "inactivity", "manual_executor", "death_certificate", "scheduled_release"
  scheduled_release_time timestamp with time zone,
  requires_verified_beneficiaries boolean not null default false,
  kyc_reference text,
  tx_hash text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for faster queries
create index crypto_wills_creator_address_idx on crypto_wills(creator_address);
create index crypto_wills_contract_will_id_idx on crypto_wills(contract_will_id);
create index crypto_wills_executed_idx on crypto_wills(executed);

-- Table for storing will beneficiaries
create table will_beneficiaries (
  id uuid default uuid_generate_v4() primary key,
  will_id uuid not null references crypto_wills(id),
  beneficiary_address text not null,
  share_percentage integer not null, -- Out of 10000 (100.00%)
  is_verified boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(will_id, beneficiary_address)
);

-- Index for faster queries
create index will_beneficiaries_will_id_idx on will_beneficiaries(will_id);
create index will_beneficiaries_beneficiary_address_idx on will_beneficiaries(beneficiary_address);

-- Table for storing death certificates
create table death_certificates (
  id uuid default uuid_generate_v4() primary key,
  will_id uuid not null references crypto_wills(id),
  certificate_uri text not null,
  validated_by text not null, -- Address of the validator
  validation_timestamp timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Index for faster queries
create index death_certificates_will_id_idx on death_certificates(will_id);

-- Table for tracking will executions
create table will_executions (
  id uuid default uuid_generate_v4() primary key,
  will_id uuid not null references crypto_wills(id),
  executed_at timestamp with time zone not null,
  executed_by text not null, -- Address of the executor or system for auto-execution
  tx_hash text,
  execution_reason text not null, -- "inactivity", "death_certificate", "scheduled_release", "manual"
  created_at timestamp with time zone default now()
);

-- Index for faster queries
create index will_executions_will_id_idx on will_executions(will_id);

-- Set up Row Level Security (RLS) for wills tables

-- KYC Verifications RLS
alter table kyc_verifications enable row level security;

create policy "Users can view their own KYC verification"
  on kyc_verifications for select
  using (user_address = auth.jwt() -> 'wallet_address');

create policy "Users can insert their own KYC verification"
  on kyc_verifications for insert
  with check (user_address = auth.jwt() -> 'wallet_address');

create policy "Users can update their own KYC verification"
  on kyc_verifications for update
  using (user_address = auth.jwt() -> 'wallet_address');

-- Crypto Wills RLS
alter table crypto_wills enable row level security;

create policy "Users can view their own wills"
  on crypto_wills for select
  using (creator_address = auth.jwt() -> 'wallet_address');

create policy "Beneficiaries can view wills they are part of"
  on crypto_wills for select
  using (
    id in (
      select will_id from will_beneficiaries 
      where beneficiary_address = auth.jwt() -> 'wallet_address'
    )
  );

create policy "Users can insert their own wills"
  on crypto_wills for insert
  with check (creator_address = auth.jwt() -> 'wallet_address');

create policy "Users can update their own wills"
  on crypto_wills for update
  using (creator_address = auth.jwt() -> 'wallet_address');

-- Will Beneficiaries RLS
alter table will_beneficiaries enable row level security;

create policy "Users can view beneficiaries of their own wills"
  on will_beneficiaries for select
  using (
    will_id in (
      select id from crypto_wills 
      where creator_address = auth.jwt() -> 'wallet_address'
    )
  );

create policy "Beneficiaries can view their own entries"
  on will_beneficiaries for select
  using (beneficiary_address = auth.jwt() -> 'wallet_address');

create policy "Users can insert beneficiaries to their own wills"
  on will_beneficiaries for insert
  with check (
    will_id in (
      select id from crypto_wills 
      where creator_address = auth.jwt() -> 'wallet_address'
    )
  );

create policy "Users can update beneficiaries of their own wills"
  on will_beneficiaries for update
  using (
    will_id in (
      select id from crypto_wills 
      where creator_address = auth.jwt() -> 'wallet_address'
    )
  );

-- Death Certificates RLS
alter table death_certificates enable row level security;

create policy "Users can view death certificates for their own wills"
  on death_certificates for select
  using (
    will_id in (
      select id from crypto_wills 
      where creator_address = auth.jwt() -> 'wallet_address'
    )
  );

create policy "Beneficiaries can view death certificates for wills they're part of"
  on death_certificates for select
  using (
    will_id in (
      select wb.will_id from will_beneficiaries wb
      where wb.beneficiary_address = auth.jwt() -> 'wallet_address'
    )
  );

-- Will Executions RLS
alter table will_executions enable row level security;

create policy "Users can view executions of their own wills"
  on will_executions for select
  using (
    will_id in (
      select id from crypto_wills 
      where creator_address = auth.jwt() -> 'wallet_address'
    )
  );

create policy "Beneficiaries can view executions of wills they're part of"
  on will_executions for select
  using (
    will_id in (
      select wb.will_id from will_beneficiaries wb
      where wb.beneficiary_address = auth.jwt() -> 'wallet_address'
    )
  );
