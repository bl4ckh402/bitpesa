module {
  public type Config = {
    owner : Principal;
    ckbtc_canister : Principal;
    stablecoin_canister : Principal;
    own_principal : Principal;
  };

  // Chain Fusion specific configuration 
  public type ChainFusionConfig = {
    owner : Principal;
    ckbtc_canister : Principal;  // For Bitcoin-related tokens on ICP
    stablecoin_canister : Principal;  // For USDC/stablecoin on ICP
    ckusdc_canister : Principal;  // ckUSDC canister on ICP
    evm_rpc_canister : ?Principal;  // EVM RPC canister (optional, uses default if not provided)
    own_principal : Principal;
  };

  public type ICRC1 = actor {
    icrc1_balance_of : (account : { owner : Principal; subaccount : ?Blob }) -> async Nat;
    icrc1_transfer : (
      args : {
        to : { owner : Principal; subaccount : ?Blob };
        amount : Nat;
        fee : ?Nat;
        memo : ?Blob;
        created_at_time : ?Nat64;
      }
    ) -> async { #Ok : Nat; #Err : Text };
    icrc2_transfer_from : (
      args : {
        spender_subaccount : ?Blob;
        from : { owner : Principal; subaccount : ?Blob };
        to : { owner : Principal; subaccount : ?Blob };
        amount : Nat;
        fee : ?Nat;
        memo : ?Blob;
        created_at_time : ?Nat64;
      }
    ) -> async { #Ok : Nat; #Err : Text };
  };
};
