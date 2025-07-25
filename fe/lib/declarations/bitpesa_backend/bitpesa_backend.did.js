export const idlFactory = ({ IDL }) => {
  const Satoshi = IDL.Nat64;
  const Result_8 = IDL.Variant({
    'ok' : IDL.Record({
      'total_fee_paid' : Satoshi,
      'transaction_bytes' : IDL.Vec(IDL.Nat8),
      'total_amount_sent' : Satoshi,
      'recipients_count' : IDL.Nat,
      'change_amount' : Satoshi,
    }),
    'err' : IDL.Text,
  });
  const MillisatoshiPerByte = IDL.Nat64;
  const Result_7 = IDL.Variant({
    'ok' : IDL.Record({
      'outputs_created' : IDL.Nat,
      'total_fee_paid' : Satoshi,
      'transaction_bytes' : IDL.Vec(IDL.Nat8),
      'size_bytes' : IDL.Nat,
      'is_rbf_enabled' : IDL.Bool,
      'transaction_id_preview' : IDL.Text,
      'change_output_amount' : Satoshi,
      'inputs_used' : IDL.Nat,
      'fee_rate_used' : MillisatoshiPerByte,
    }),
    'err' : IDL.Text,
  });
  const Outpoint = IDL.Record({
    'txid' : IDL.Vec(IDL.Nat8),
    'vout' : IDL.Nat32,
  });
  const Utxo = IDL.Record({
    'height' : IDL.Nat32,
    'value' : Satoshi,
    'outpoint' : Outpoint,
  });
  const Result_6 = IDL.Variant({
    'ok' : IDL.Record({
      'transaction_bytes' : IDL.Vec(IDL.Nat8),
      'total_fee' : Satoshi,
      'change_amount' : Satoshi,
      'selected_utxos' : IDL.Vec(Utxo),
    }),
    'err' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Result_5 = IDL.Variant({
    'ok' : IDL.Record({
      'high_priority_fee' : Satoshi,
      'low_priority_fee' : Satoshi,
      'medium_priority_fee' : Satoshi,
      'estimated_size_bytes' : IDL.Nat,
    }),
    'err' : IDL.Text,
  });
  const BitcoinNetwork = IDL.Variant({
    'mainnet' : IDL.Null,
    'regtest' : IDL.Null,
    'testnet' : IDL.Null,
  });
  const Result_4 = IDL.Variant({ 'ok' : Satoshi, 'err' : IDL.Text });
  const Page = IDL.Vec(IDL.Nat8);
  const BlockHash = IDL.Vec(IDL.Nat8);
  const GetUtxosResponse = IDL.Record({
    'next_page' : IDL.Opt(Page),
    'tip_height' : IDL.Nat32,
    'tip_block_hash' : BlockHash,
    'utxos' : IDL.Vec(Utxo),
  });
  const Result_3 = IDL.Variant({ 'ok' : GetUtxosResponse, 'err' : IDL.Text });
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
  const Result_1 = IDL.Variant({
    'ok' : IDL.Record({
      'is_valid' : IDL.Bool,
      'network' : IDL.Text,
      'address_type' : IDL.Text,
    }),
    'err' : IDL.Text,
  });
  const Result = IDL.Variant({
    'ok' : IDL.Record({
      'input_count' : IDL.Nat,
      'output_count' : IDL.Nat,
      'size' : IDL.Nat,
      'estimated_fee_rate' : MillisatoshiPerByte,
    }),
    'err' : IDL.Text,
  });
  return IDL.Service({
    'build_batch_transaction' : IDL.Func(
        [
          IDL.Vec(IDL.Record({ 'address' : IDL.Text, 'amount' : Satoshi })),
          IDL.Variant({
            'economical' : IDL.Null,
            'priority' : IDL.Null,
            'standard' : IDL.Null,
          }),
        ],
        [Result_8],
        [],
      ),
    'build_optimized_transaction' : IDL.Func(
        [
          IDL.Text,
          Satoshi,
          IDL.Variant({
            'economical' : IDL.Null,
            'priority' : IDL.Null,
            'standard' : IDL.Null,
          }),
          IDL.Bool,
        ],
        [Result_7],
        [],
      ),
    'build_transaction_with_fee_estimation' : IDL.Func(
        [
          IDL.Text,
          Satoshi,
          IDL.Variant({
            'low' : IDL.Null,
            'high' : IDL.Null,
            'medium' : IDL.Null,
          }),
        ],
        [Result_6],
        [],
      ),
    'create_bitpesa' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Principal],
        [IDL.Principal],
        [],
      ),
    'demo_bitcoin_transaction_workflow' : IDL.Func([], [Result_2], []),
    'estimate_transaction_fees' : IDL.Func([IDL.Nat, IDL.Nat], [Result_5], []),
    'getBtcPrice' : IDL.Func([], [Result_2], []),
    'getCyclesBalance' : IDL.Func([], [IDL.Nat], ['query']),
    'get_bitcoin_network_info' : IDL.Func(
        [],
        [
          IDL.Record({
            'balance' : IDL.Opt(Satoshi),
            'canister_address' : IDL.Opt(IDL.Text),
            'network' : BitcoinNetwork,
          }),
        ],
        [],
      ),
    'get_bitpesa' : IDL.Func([], [IDL.Opt(IDL.Principal)], ['query']),
    'get_canister_bitcoin_address' : IDL.Func([], [Result_2], []),
    'get_canister_bitcoin_balance' : IDL.Func([], [Result_4], []),
    'get_canister_utxos' : IDL.Func([], [Result_3], []),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'health' : IDL.Func(
        [],
        [IDL.Record({ 'status' : IDL.Text, 'timestamp' : IDL.Int })],
        ['query'],
      ),
    'send_bitcoin' : IDL.Func([IDL.Text, Satoshi], [Result_2], []),
    'transform' : IDL.Func([TransformArgs], [HttpResponse], ['query']),
    'validate_bitcoin_address' : IDL.Func([IDL.Text], [Result_1], ['query']),
    'validate_transaction' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
