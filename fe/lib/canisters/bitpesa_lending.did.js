export const idlFactory = ({ IDL }) => {
  const Config = IDL.Record({
    'owner' : IDL.Principal,
    'ckbtc_canister' : IDL.Principal,
    'own_principal' : IDL.Principal,
    'stablecoin_canister' : IDL.Principal,
  });
  const LoanId = IDL.Nat;
  const AppError = IDL.Variant({
    'AddressGenerationFailed' : IDL.Text,
    'InsufficientPlatformLiquidity' : IDL.Null,
    'CollateralLocked' : IDL.Null,
    'RepaymentTooLow' : IDL.Null,
    'InsufficientCollateral' : IDL.Null,
    'PriceOracleFailed' : IDL.Text,
    'LoanNotFound' : IDL.Null,
    'BitcoinError' : IDL.Text,
    'InsufficientBalance' : IDL.Null,
    'Unauthorized' : IDL.Null,
    'LoanExceedsCollateralRatio' : IDL.Null,
    'TransferFailed' : IDL.Text,
    'LoanNotActive' : IDL.Null,
    'InvalidLoanDuration' : IDL.Null,
  });
  const Result_4 = IDL.Variant({ 'ok' : LoanId, 'err' : AppError });
  const Satoshi = IDL.Nat64;
  const Result_2 = IDL.Variant({ 'ok' : Satoshi, 'err' : AppError });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : AppError });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : AppError });
  const CollateralType = IDL.Variant({
    'ckBTC' : IDL.Null,
    'NativeBTC' : IDL.Null,
  });
  const Time = IDL.Int;
  const Loan = IDL.Record({
    'id' : LoanId,
    'active' : IDL.Bool,
    'loanAmount' : IDL.Nat,
    'collateralType' : CollateralType,
    'interestRateBps' : IDL.Nat,
    'borrower' : IDL.Principal,
    'collateralAmount' : IDL.Nat,
    'endTimestamp' : Time,
    'liquidated' : IDL.Bool,
    'startTimestamp' : Time,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : AppError });
  const BitcoinNetwork = IDL.Variant({
    'mainnet' : IDL.Null,
    'regtest' : IDL.Null,
    'testnet' : IDL.Null,
  });
  const HttpHeader = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const HttpResponse = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HttpHeader),
  });
  const TransformArgs = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : HttpResponse,
  });
  const BitPesaLending = IDL.Service({
    'createBitcoinLoan' : IDL.Func([IDL.Nat, IDL.Nat], [Result_4], []),
    'depositBitcoinCollateral' : IDL.Func([], [Result_2], []),
    'generateUserBitcoinAddress' : IDL.Func([], [Result_1], []),
    'getAvailableCollateral' : IDL.Func([], [IDL.Nat], ['query']),
    'getBtcUsdPrice' : IDL.Func([], [Result_3], []),
    'getLoan' : IDL.Func([LoanId], [IDL.Opt(Loan)], ['query']),
    'getPlatformStats' : IDL.Func(
        [],
        [
          IDL.Record({
            'totalCollateral' : IDL.Nat,
            'totalOutstanding' : IDL.Nat,
            'totalLoans' : IDL.Nat,
            'totalBitcoinCollateral' : Satoshi,
            'protocolFees' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getUserBitcoinAddress' : IDL.Func([], [IDL.Opt(IDL.Text)], ['query']),
    'getUserBitcoinBalance' : IDL.Func([], [Result_2], []),
    'getUserBitcoinCollateral' : IDL.Func([], [Satoshi], ['query']),
    'getUserLoans' : IDL.Func([IDL.Principal], [IDL.Vec(Loan)], ['query']),
    'repayLoan' : IDL.Func([LoanId], [Result], []),
    'setBitcoinNetwork' : IDL.Func([BitcoinNetwork], [], ['oneway']),
    'transform' : IDL.Func([TransformArgs], [HttpResponse], ['query']),
    'updateCollateralRatio' : IDL.Func([IDL.Nat], [], ['oneway']),
    'update_own_principal' : IDL.Func([IDL.Principal], [], []),
    'withdrawBitcoinCollateral' : IDL.Func([IDL.Nat, IDL.Text], [Result_1], []),
    'withdrawFees' : IDL.Func([IDL.Nat], [Result], []),
  });
  return BitPesaLending;
};
export const init = ({ IDL }) => {
  const Config = IDL.Record({
    'owner' : IDL.Principal,
    'ckbtc_canister' : IDL.Principal,
    'own_principal' : IDL.Principal,
    'stablecoin_canister' : IDL.Principal,
  });
  return [Config];
};
