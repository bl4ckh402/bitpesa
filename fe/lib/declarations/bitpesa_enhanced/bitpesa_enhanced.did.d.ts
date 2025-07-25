import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AppError = { 'AddressGenerationFailed' : string } |
  { 'InsufficientPlatformLiquidity' : null } |
  { 'CollateralLocked' : null } |
  { 'RepaymentTooLow' : null } |
  { 'InsufficientCollateral' : null } |
  { 'PriceOracleFailed' : string } |
  { 'LoanNotFound' : null } |
  { 'BitcoinError' : string } |
  { 'InsufficientBalance' : null } |
  { 'Unauthorized' : null } |
  { 'LoanExceedsCollateralRatio' : null } |
  { 'TransferFailed' : string } |
  { 'LoanNotActive' : null } |
  { 'InvalidLoanDuration' : null };
export interface BitPesaLending {
  'createBitcoinLoan' : ActorMethod<[bigint, bigint], Result_4>,
  'depositBitcoinCollateral' : ActorMethod<[], Result_2>,
  'generateUserBitcoinAddress' : ActorMethod<[], Result_1>,
  'getAvailableCollateral' : ActorMethod<[], bigint>,
  'getBtcUsdPrice' : ActorMethod<[], Result_3>,
  'getLoan' : ActorMethod<[LoanId], [] | [Loan]>,
  'getPlatformStats' : ActorMethod<
    [],
    {
      'totalCollateral' : bigint,
      'totalOutstanding' : bigint,
      'totalLoans' : bigint,
      'totalBitcoinCollateral' : Satoshi,
      'protocolFees' : bigint,
    }
  >,
  'getUserBitcoinAddress' : ActorMethod<[], [] | [string]>,
  'getUserBitcoinBalance' : ActorMethod<[], Result_2>,
  'getUserBitcoinCollateral' : ActorMethod<[], Satoshi>,
  'getUserLoans' : ActorMethod<[Principal], Array<Loan>>,
  'repayLoan' : ActorMethod<[LoanId], Result>,
  'setBitcoinNetwork' : ActorMethod<[BitcoinNetwork], undefined>,
  'transform' : ActorMethod<[TransformArgs], HttpResponse>,
  'updateCollateralRatio' : ActorMethod<[bigint], undefined>,
  'update_own_principal' : ActorMethod<[Principal], undefined>,
  'withdrawBitcoinCollateral' : ActorMethod<[bigint, string], Result_1>,
  'withdrawFees' : ActorMethod<[bigint], Result>,
}
export type BitcoinNetwork = { 'mainnet' : null } |
  { 'regtest' : null } |
  { 'testnet' : null };
export type CollateralType = { 'ckBTC' : null } |
  { 'NativeBTC' : null };
export interface Config {
  'owner' : Principal,
  'ckbtc_canister' : Principal,
  'own_principal' : Principal,
  'stablecoin_canister' : Principal,
}
export interface HttpHeader { 'value' : string, 'name' : string }
export interface HttpResponse {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HttpHeader>,
}
export interface Loan {
  'id' : LoanId,
  'active' : boolean,
  'loanAmount' : bigint,
  'collateralType' : CollateralType,
  'interestRateBps' : bigint,
  'borrower' : Principal,
  'collateralAmount' : bigint,
  'endTimestamp' : Time,
  'liquidated' : boolean,
  'startTimestamp' : Time,
}
export type LoanId = bigint;
export type Result = { 'ok' : null } |
  { 'err' : AppError };
export type Result_1 = { 'ok' : string } |
  { 'err' : AppError };
export type Result_2 = { 'ok' : Satoshi } |
  { 'err' : AppError };
export type Result_3 = { 'ok' : bigint } |
  { 'err' : AppError };
export type Result_4 = { 'ok' : LoanId } |
  { 'err' : AppError };
export type Satoshi = bigint;
export type Time = bigint;
export interface TransformArgs {
  'context' : Uint8Array | number[],
  'response' : HttpResponse,
}
export interface _SERVICE extends BitPesaLending {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
