// Type definitions for the BitPesa backend canister
import { Principal } from '@dfinity/principal';

export type Satoshi = bigint;
export type MillisatoshiPerByte = bigint;

export interface BitcoinNetworkInfo {
  network: { mainnet?: null; regtest?: null; testnet?: null };
  canister_address: string | null;
  balance: Satoshi | null;
}

export interface BitcoinNetwork {
  mainnet?: null;
  regtest?: null;
  testnet?: null;
}

export interface Outpoint {
  txid: Uint8Array;
  vout: number;
}

export interface Utxo {
  height: number;
  value: Satoshi;
  outpoint: Outpoint;
}

export interface GetUtxosResponse {
  next_page: Uint8Array | null;
  tip_height: number;
  tip_block_hash: Uint8Array;
  utxos: Utxo[];
}

export interface HealthResponse {
  status: string;
  timestamp: bigint;
}

export interface Result<T> {
  ok?: T;
  err?: string;
}

export interface TransactionFeeEstimation {
  high_priority_fee: Satoshi;
  low_priority_fee: Satoshi;
  medium_priority_fee: Satoshi;
  estimated_size_bytes: bigint;
}

export interface OptimizedTransaction {
  transaction_bytes: Uint8Array;
  transaction_id_preview: string;
  total_fee_paid: Satoshi;
  change_output_amount: Satoshi;
  inputs_used: bigint;
  outputs_created: bigint;
  fee_rate_used: MillisatoshiPerByte;
  size_bytes: bigint;
  is_rbf_enabled: boolean;
}

export interface BitcoinAddressValidation {
  is_valid: boolean;
  network: string;
  address_type: string;
}

// Define the interface for the BitPesa backend canister
export interface BitpesaBackendService {
  greet: (name: string) => Promise<string>;
  getBtcPrice: () => Promise<Result<string>>;
  health: () => Promise<HealthResponse>;
  getCyclesBalance: () => Promise<bigint>;
  get_canister_bitcoin_address: () => Promise<Result<string>>;
  get_canister_bitcoin_balance: () => Promise<Result<Satoshi>>;
  get_canister_utxos: () => Promise<Result<GetUtxosResponse>>;
  get_bitcoin_network_info: () => Promise<BitcoinNetworkInfo>;
  get_bitpesa: () => Promise<[Principal] | []>; // Optional Principal
  create_bitpesa: (owner: Principal, ckbtc: Principal, stablecoin: Principal) => Promise<Principal>;
  send_bitcoin: (toAddress: string, amountSatoshi: Satoshi) => Promise<Result<string>>;
  build_transaction_with_fee_estimation: (
    toAddress: string, 
    amountSatoshi: Satoshi, 
    feePriority: { low: null } | { medium: null } | { high: null }
  ) => Promise<Result<{
    transaction_bytes: Uint8Array;
    total_fee: Satoshi;
    change_amount: Satoshi;
    selected_utxos: Utxo[];
  }>>;
  validate_bitcoin_address: (address: string) => Promise<Result<BitcoinAddressValidation>>;
  estimate_transaction_fees: (
    inputCount: bigint, 
    outputCount: bigint
  ) => Promise<Result<TransactionFeeEstimation>>;
  build_optimized_transaction: (
    toAddress: string,
    amountSatoshi: Satoshi,
    feeStrategy: { economical: null } | { standard: null } | { priority: null },
    includeRbf: boolean
  ) => Promise<Result<OptimizedTransaction>>;
  demo_bitcoin_transaction_workflow: () => Promise<Result<string>>;
  validate_transaction: (transactionBytes: Uint8Array) => Promise<Result<{
    input_count: bigint;
    output_count: bigint;
    size: bigint;
    estimated_fee_rate: MillisatoshiPerByte;
  }>>;
  build_batch_transaction: (
    recipients: Array<{ address: string; amount: Satoshi }>,
    feeStrategy: { economical: null } | { standard: null } | { priority: null }
  ) => Promise<Result<{
    transaction_bytes: Uint8Array;
    total_fee_paid: Satoshi;
    total_amount_sent: Satoshi;
    recipients_count: bigint;
    change_amount: Satoshi;
  }>>;
  transform: (args: {
    context: Uint8Array;
    response: {
      status: number;
      body: Uint8Array;
      headers: Array<{ name: string; value: string }>;
    }
  }) => Promise<{
    status: number;
    body: Uint8Array;
    headers: Array<{ name: string; value: string }>;
  }>;
}
