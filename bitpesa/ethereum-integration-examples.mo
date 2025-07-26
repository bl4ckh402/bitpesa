/**
 * USDC-Ethereum-Integration-Examples.mo
 * 
 * This module contains examples of how to use the Ethereum and Chain Fusion
 * integrations for BitPesa's cross-chain lending functionality.
 */

import EthereumAPI "./src/bitpesa_backend/EthereumAPI";
import ChainKeyTokenAPI "./src/bitpesa_backend/ChainKeyTokenAPI";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import BitcoinAPI "./src/bitpesa_backend/BitcoinAPI";

module {
  // Configuration - replace with actual canister IDs
  let ckUSDC_CANISTER_ID = "mxzaz-hqaaa-aaaar-qaada-cai"; // Chain key USDC canister
  let ETHEREUM_RPC_CANISTER_ID = "7hfb6-caaaa-aaaar-qadga-cai"; // EVM RPC canister
  
  // Example 1: Check USDC Balance on Ethereum
  public func example_check_erc20_balance(address: EthereumAPI.EvmAddress) : async Result.Result<EthereumAPI.TokenAmount, Text> {
    Debug.print("Checking USDC balance for address: " # address);
    
    try {
      let balanceResult = await EthereumAPI.getErc20Balance(
        EthereumAPI.USDC_ETHEREUM,
        address,
        ?ETHEREUM_RPC_CANISTER_ID
      );
      
      switch (balanceResult) {
        case (#ok(balance)) {
          Debug.print("Balance: " # debug_show(balance));
          #ok(balance);
        };
        case (#err(error)) {
          Debug.print("Error checking balance: " # debug_show(error));
          #err("Failed to check balance: " # debug_show(error));
        };
      };
    } catch (e) {
      #err("Exception: " # Error.message(e));
    };
  };

  // Example 2: Convert ckUSDC to USDC on Ethereum
  public func example_convert_ckusdc_to_ethereum(
    amount: Nat,
    ethereumAddress: EthereumAPI.EvmAddress
  ) : async Result.Result<Nat, Text> {
    Debug.print("Converting " # debug_show(amount) # " ckUSDC to USDC on Ethereum");
    
    try {
      let convertResult = await ChainKeyTokenAPI.convertCkUsdcToEthereumUsdc(
        Principal.fromText(ckUSDC_CANISTER_ID),
        amount,
        ethereumAddress,
        null // Use default caller
      );
      
      switch (convertResult) {
        case (#ok(txId)) {
          Debug.print("Conversion successful. Transaction ID: " # debug_show(txId));
          #ok(txId);
        };
        case (#err(error)) {
          Debug.print("Error converting tokens: " # debug_show(error));
          #err("Conversion failed: " # debug_show(error));
        };
      };
    } catch (e) {
      #err("Exception: " # Error.message(e));
    };
  };

  // Example 3: Complete Cross-Chain Loan Flow
  public func example_cross_chain_loan(
    btcAmount: BitcoinAPI.Satoshi, 
    usdcAmount: Nat, 
    ethereumAddress: EthereumAPI.EvmAddress,
    btcCollateralAddress: Text
  ) : async Result.Result<Text, Text> {
    Debug.print("Starting cross-chain loan flow");
    Debug.print("BTC Collateral: " # debug_show(btcAmount) # " satoshis");
    Debug.print("USDC Loan: " # debug_show(usdcAmount) # " (with 6 decimals)");
    Debug.print("Ethereum Address for receiving USDC: " # ethereumAddress);
    
    // Step 1: Check if BTC collateral is received
    let btcBalanceRequest : BitcoinAPI.GetBalanceRequest = {
      address = btcCollateralAddress;
      network = #testnet;
      min_confirmations = ?1;
    };
    
    try {
      let btcBalanceResult = await BitcoinAPI.get_balance(btcBalanceRequest);
      
      switch (btcBalanceResult) {
        case (#ok(balance)) {
          if (balance < btcAmount) {
            return #err("Insufficient Bitcoin collateral. Expected: " # 
              debug_show(btcAmount) # ", Actual: " # debug_show(balance));
          };
          
          Debug.print("✅ Bitcoin collateral verified: " # debug_show(balance) # " satoshis");
          
          // Step 2: Convert ckUSDC to USDC on Ethereum and send to user
          let convertResult = await example_convert_ckusdc_to_ethereum(
            usdcAmount,
            ethereumAddress
          );
          
          switch (convertResult) {
            case (#ok(txId)) {
              Debug.print("✅ USDC sent successfully to Ethereum address");
              #ok("Loan successfully processed. USDC sent to Ethereum address. Transaction ID: " # debug_show(txId));
            };
            case (#err(error)) {
              #err("Failed to send USDC to Ethereum: " # error);
            };
          };
        };
        case (#err(error)) {
          #err("Failed to check Bitcoin balance: " # BitcoinAPI.error_to_text(error));
        };
      };
    } catch (e) {
      #err("Exception during loan processing: " # Error.message(e));
    };
  };

  // Demo function to illustrate the complete flow
  public func demo_complete_workflow() : async () {
    Debug.print("=== BitPesa Cross-Chain Lending Demo ===");
    
    // 1. Example Ethereum address
    let ethereumAddress = "0x1234567890123456789012345678901234567890";
    
    // 2. Check initial USDC balance
    Debug.print("1. Checking initial USDC balance on Ethereum");
    switch (await example_check_erc20_balance(ethereumAddress)) {
      case (#ok(balance)) {
        Debug.print("Initial USDC balance: " # debug_show(balance));
      };
      case (#err(error)) {
        Debug.print("Failed to check initial balance: " # error);
      };
    };
    
    // 3. Perform a cross-chain loan
    Debug.print("\n2. Processing cross-chain loan");
    switch (await example_cross_chain_loan(
      5_000_000, // 0.05 BTC collateral
      50_000_000, // 50 USDC loan
      ethereumAddress,
      "tb1qxvctnmtyj7mk82jmwp9bzf97s3q8kmkn52hgff" // Example Bitcoin testnet address
    )) {
      case (#ok(result)) {
        Debug.print("Loan processed successfully: " # result);
      };
      case (#err(error)) {
        Debug.print("Loan processing failed: " # error);
      };
    };
    
    // 4. Check final USDC balance
    Debug.print("\n3. Checking final USDC balance on Ethereum");
    switch (await example_check_erc20_balance(ethereumAddress)) {
      case (#ok(balance)) {
        Debug.print("Final USDC balance: " # debug_show(balance));
      };
      case (#err(error)) {
        Debug.print("Failed to check final balance: " # error);
      };
    };
    
    Debug.print("\n=== Demo completed ===");
  };
}
