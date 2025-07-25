import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type BitcoinNetwork = { 'mainnet' : null } |
  { 'regtest' : null } |
  { 'testnet' : null };
export type BlockHash = Uint8Array | number[];
export interface GetUtxosResponse {
  'next_page' : [] | [Page],
  'tip_height' : number,
  'tip_block_hash' : BlockHash,
  'utxos' : Array<Utxo>,
}
export interface HttpHeader { 'value' : string, 'name' : string }
export interface HttpResponse {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HttpHeader>,
}
export type MillisatoshiPerByte = bigint;
export interface Outpoint { 'txid' : Uint8Array | number[], 'vout' : number }
export type Page = Uint8Array | number[];
export type Result = {
    'ok' : {
      'input_count' : bigint,
      'output_count' : bigint,
      'size' : bigint,
      'estimated_fee_rate' : MillisatoshiPerByte,
    }
  } |
  { 'err' : string };
export type Result_1 = {
    'ok' : { 'is_valid' : boolean, 'network' : string, 'address_type' : string }
  } |
  { 'err' : string };
export type Result_2 = { 'ok' : string } |
  { 'err' : string };
export type Result_3 = { 'ok' : GetUtxosResponse } |
  { 'err' : string };
export type Result_4 = { 'ok' : Satoshi } |
  { 'err' : string };
export type Result_5 = {
    'ok' : {
      'high_priority_fee' : Satoshi,
      'low_priority_fee' : Satoshi,
      'medium_priority_fee' : Satoshi,
      'estimated_size_bytes' : bigint,
    }
  } |
  { 'err' : string };
export type Result_6 = {
    'ok' : {
      'transaction_bytes' : Uint8Array | number[],
      'total_fee' : Satoshi,
      'change_amount' : Satoshi,
      'selected_utxos' : Array<Utxo>,
    }
  } |
  { 'err' : string };
export type Result_7 = {
    'ok' : {
      'outputs_created' : bigint,
      'total_fee_paid' : Satoshi,
      'transaction_bytes' : Uint8Array | number[],
      'size_bytes' : bigint,
      'is_rbf_enabled' : boolean,
      'transaction_id_preview' : string,
      'change_output_amount' : Satoshi,
      'inputs_used' : bigint,
      'fee_rate_used' : MillisatoshiPerByte,
    }
  } |
  { 'err' : string };
export type Result_8 = {
    'ok' : {
      'total_fee_paid' : Satoshi,
      'transaction_bytes' : Uint8Array | number[],
      'total_amount_sent' : Satoshi,
      'recipients_count' : bigint,
      'change_amount' : Satoshi,
    }
  } |
  { 'err' : string };
export type Satoshi = bigint;
export interface TransformArgs {
  'context' : Uint8Array | number[],
  'response' : HttpResponse,
}
export interface Utxo {
  'height' : number,
  'value' : Satoshi,
  'outpoint' : Outpoint,
}
export interface _SERVICE {
  'build_batch_transaction' : ActorMethod<
    [
      Array<{ 'address' : string, 'amount' : Satoshi }>,
      { 'economical' : null } |
        { 'priority' : null } |
        { 'standard' : null },
    ],
    Result_8
  >,
  'build_optimized_transaction' : ActorMethod<
    [
      string,
      Satoshi,
      { 'economical' : null } |
        { 'priority' : null } |
        { 'standard' : null },
      boolean,
    ],
    Result_7
  >,
  'build_transaction_with_fee_estimation' : ActorMethod<
    [
      string,
      Satoshi,
      { 'low' : null } |
        { 'high' : null } |
        { 'medium' : null },
    ],
    Result_6
  >,
  'create_bitpesa' : ActorMethod<[Principal, Principal, Principal], Principal>,
  'demo_bitcoin_transaction_workflow' : ActorMethod<[], Result_2>,
  'estimate_transaction_fees' : ActorMethod<[bigint, bigint], Result_5>,
  'getBtcPrice' : ActorMethod<[], Result_2>,
  'getCyclesBalance' : ActorMethod<[], bigint>,
  'get_bitcoin_network_info' : ActorMethod<
    [],
    {
      'balance' : [] | [Satoshi],
      'canister_address' : [] | [string],
      'network' : BitcoinNetwork,
    }
  >,
  'get_bitpesa' : ActorMethod<[], [] | [Principal]>,
  'get_canister_bitcoin_address' : ActorMethod<[], Result_2>,
  'get_canister_bitcoin_balance' : ActorMethod<[], Result_4>,
  'get_canister_utxos' : ActorMethod<[], Result_3>,
  'greet' : ActorMethod<[string], string>,
  'health' : ActorMethod<[], { 'status' : string, 'timestamp' : bigint }>,
  'send_bitcoin' : ActorMethod<[string, Satoshi], Result_2>,
  'transform' : ActorMethod<[TransformArgs], HttpResponse>,
  'validate_bitcoin_address' : ActorMethod<[string], Result_1>,
  'validate_transaction' : ActorMethod<[Uint8Array | number[]], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
