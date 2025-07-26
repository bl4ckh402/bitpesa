/**
 * ChainKeyTokenAPI.mo
 * 
 * This module provides Chain Key Token (ckTokens) specific operations
 * for working with tokens like ckBTC and ckUSDC on the Internet Computer.
 * It handles the creation of Chain Key tokens and their conversion to native tokens.
 */

import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Error "mo:base/Error";
import Debug "mo:base/Debug";
import BitcoinAPI "./BitcoinAPI";
import EthereumAPI "./EthereumAPI";

module {
    // ========================================
    // Types
    // ========================================
    
    public type TokenError = {
        #InsufficientFunds;
        #TransferFailed : Text;
        #CanisterError : Text;
        #InvalidAddress;
        #NotificationFailed;
        #ConversionFailed : Text;
        #Other : Text;
    };
    
    public type TokenResult<T> = Result.Result<T, TokenError>;
    
    public type TokenType = {
        #ckBTC;
        #ckETH;
        #ckUSDC;
        #ckUSDT;
    };
    
    public type Account = {
        owner : Principal;
        subaccount : ?Blob;
    };
    
    public type EvmAddress = Text;
    
    // Types for Chain Key token canisters (ICRC-1 standard)
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
    };
    
    // ckUSDC Minter Interface
    public type ckUSDCMinter = actor {
        // Convert ckUSDC to native USDC on Ethereum
        withdraw : (
            args : {
                amount : Nat;
                address : EvmAddress;
                recipient : ?Account;
            }
        ) -> async { #Ok : Nat; #Err : Text };
        
        // Get conversion fee
        get_withdrawal_fee : () -> async Nat;
    };
    
    // ========================================
    // Chain Key Token Functions for USDC
    // ========================================
    
    // Convert ckUSDC to USDC on Ethereum
    public func convertCkUsdcToEthereumUsdc(
        ckusdcMinterCanister : Principal,
        amount : Nat,
        ethereumAddress : EvmAddress,
        from : ?Account
    ) : async TokenResult<Nat> {
        let minter : ckUSDCMinter = actor(Principal.toText(ckusdcMinterCanister));
        
        try {
            // Call the ckUSDC minter's withdraw function
            let withdrawResult = await minter.withdraw({
                amount = amount;
                address = ethereumAddress;
                recipient = from;
            });
            
            switch (withdrawResult) {
                case (#Ok(txId)) {
                    #ok(txId)
                };
                case (#Err(error)) {
                    #err(#ConversionFailed(error))
                };
            };
        } catch (e) {
            #err(#CanisterError(Error.message(e)))
        };
    };
    
    // Transfer ckUSDC between accounts on ICP
    public func transferCkToken(
        tokenCanister : Principal,
        from : Account,
        to : Account,
        amount : Nat
    ) : async TokenResult<Nat> {
        let token : ICRC1 = actor(Principal.toText(tokenCanister));
        
        try {
            let transferResult = await token.icrc1_transfer({
                to = to;
                amount = amount;
                fee = null;
                memo = null;
                created_at_time = null;
            });
            
            switch (transferResult) {
                case (#Ok(txId)) {
                    #ok(txId)
                };
                case (#Err(error)) {
                    #err(#TransferFailed(error))
                };
            };
        } catch (e) {
            #err(#CanisterError(Error.message(e)))
        };
    };
    
    // Check balance of ckUSDC
    public func getBalance(
        tokenCanister : Principal,
        account : Account
    ) : async TokenResult<Nat> {
        let token : ICRC1 = actor(Principal.toText(tokenCanister));
        
        try {
            let balance = await token.icrc1_balance_of(account);
            #ok(balance)
        } catch (e) {
            #err(#CanisterError(Error.message(e)))
        };
    };
    
    // Get withdrawal fee for ckUSDC to Ethereum conversion
    public func getWithdrawalFee(
        ckusdcMinterCanister : Principal
    ) : async TokenResult<Nat> {
        let minter : ckUSDCMinter = actor(Principal.toText(ckusdcMinterCanister));
        
        try {
            let fee = await minter.get_withdrawal_fee();
            #ok(fee)
        } catch (e) {
            #err(#CanisterError(Error.message(e)))
        };
    };
}
