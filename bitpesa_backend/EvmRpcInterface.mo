/**
 * EvmRpcInterface.mo
 * 
 * Provides low-level interfaces to the EVM RPC canister.
 * This module allows direct interaction with the EVM RPC canister 
 * for Ethereum and other EVM-compatible chains.
 */

import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Error "mo:base/Error";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Array "mo:base/Array";

import EthereumAPI "./EthereumAPI";

module {
    // ========================================
    // Types
    // ========================================
    
    // EVM RPC Constants
    private let DEFAULT_EVM_RPC_CANISTER = "7hfb6-caaaa-aaaar-qadga-cai";
    
    // Request types
    public type JsonRpcRequest = {
        jsonrpc : Text;
        id : Nat;
        method : Text;
        params : [EthereumAPI.EvmValue];
    };
    
    public type JsonRpcResponse = {
        id : Nat;
        jsonrpc : Text;
        result : ?EthereumAPI.EvmValue;
        error : ?{
            code : Int;
            message : Text;
        };
    };
    
    // Chain-specific types
    public type Chain = EthereumAPI.Chain;
    public type ChainId = EthereumAPI.ChainId;
    public type Provider = EthereumAPI.Provider;
    
    // Result type
    public type EvmResult<T> = Result.Result<T, EthereumAPI.EvmError>;
    
    // ========================================
    // Interface to EVM RPC Canister
    // ========================================
    
    private type EvmRpcCanister = actor {
        // Direct JSON-RPC API
        json_rpc_request : (request : {
            chainId : Nat;
            request : JsonRpcRequest;
            provider : ?Provider;
        }) -> async EvmResult<JsonRpcResponse>;
        
        // Higher-level APIs
        eth_call : (request : {
            chainId : Nat;
            to : Text;        // Contract address
            from : ?Text;     // Optional sender address
            data : Text;      // Encoded function call
            provider : ?Provider;
        }) -> async EvmResult<Text>; // Returns hex string
        
        eth_getBalance : (request : {
            chainId : Nat;
            address : Text;
            block : ?Text;    // "latest", "earliest", "pending", or hex block number
            provider : ?Provider;
        }) -> async EvmResult<Text>; // Returns hex string balance
        
        eth_sendRawTransaction : (request : {
            chainId : Nat;
            transaction : Text; // Signed transaction data
            provider : ?Provider;
        }) -> async EvmResult<EthereumAPI.TransactionHash>;
        
        eth_getTransactionReceipt : (request : {
            chainId : Nat;
            transactionHash : Text;
            provider : ?Provider;
        }) -> async EvmResult<EthereumAPI.EvmValue>; // Returns transaction receipt object
    };
    
    // ========================================
    // Helper Functions
    // ========================================
    
    // Get chain ID as Nat from enum
    public func chainIdToNat(chainId : ChainId) : Nat {
        switch (chainId) {
            case (#Ethereum_Mainnet(id)) id;
            case (#Arbitrum_One(id)) id;
            case (#Base_Mainnet(id)) id;
            case (#Optimism_Mainnet(id)) id;
            case (#Ethereum_Sepolia(id)) id;
            case (#Custom(id)) id;
        };
    };
    
    // Get EVM RPC canister actor
    private func getEvmRpcCanister(canisterId : ?Text) : EvmRpcCanister {
        let id = switch (canisterId) {
            case (null) DEFAULT_EVM_RPC_CANISTER;
            case (?id) id;
        };
        actor(id) : EvmRpcCanister
    };
    
    // ========================================
    // EVM RPC Functions
    // ========================================
    
    // Check Ether balance of an address
    public func getEtherBalance(
        chainId : ChainId,
        address : Text,
        evmRpcCanisterId : ?Text
    ) : async EvmResult<Nat> {
        let evmRpc = getEvmRpcCanister(evmRpcCanisterId);
        let chainIdNat = chainIdToNat(chainId);
        
        try {
            let result = await evmRpc.eth_getBalance({
                chainId = chainIdNat;
                address = address;
                block = ?"latest";
                provider = ?#Alchemy;
            });
            
            switch (result) {
                case (#ok(hexBalance)) {
                    // TODO: Convert hex balance to Nat
                    // For now returning a placeholder
                    #ok(1000000000000000000) // 1 ETH in wei
                };
                case (#err(e)) {
                    #err(e)
                };
            }
        } catch (e) {
            #err(#CanisterCallError(Error.message(e)))
        }
    };
    
    // Get transaction receipt
    public func getTransactionReceipt(
        chainId : ChainId,
        txHash : Text,
        evmRpcCanisterId : ?Text
    ) : async EvmResult<EthereumAPI.EvmValue> {
        let evmRpc = getEvmRpcCanister(evmRpcCanisterId);
        let chainIdNat = chainIdToNat(chainId);
        
        try {
            let result = await evmRpc.eth_getTransactionReceipt({
                chainId = chainIdNat;
                transactionHash = txHash;
                provider = ?#Alchemy;
            });
            
            result
        } catch (e) {
            #err(#CanisterCallError(Error.message(e)))
        }
    };
    
    // Call contract view function (no state change)
    public func callContractView(
        chainId : ChainId,
        contractAddress : Text,
        callData : Text,
        evmRpcCanisterId : ?Text
    ) : async EvmResult<Text> {
        let evmRpc = getEvmRpcCanister(evmRpcCanisterId);
        let chainIdNat = chainIdToNat(chainId);
        
        try {
            let result = await evmRpc.eth_call({
                chainId = chainIdNat;
                to = contractAddress;
                from = null;
                data = callData;
                provider = ?#Alchemy;
            });
            
            result
        } catch (e) {
            #err(#CanisterCallError(Error.message(e)))
        }
    };
    
    // Send raw transaction to the network
    public func sendRawTransaction(
        chainId : ChainId,
        signedTxData : Text,
        evmRpcCanisterId : ?Text
    ) : async EvmResult<EthereumAPI.TransactionHash> {
        let evmRpc = getEvmRpcCanister(evmRpcCanisterId);
        let chainIdNat = chainIdToNat(chainId);
        
        try {
            let result = await evmRpc.eth_sendRawTransaction({
                chainId = chainIdNat;
                transaction = signedTxData;
                provider = ?#Alchemy;
            });
            
            result
        } catch (e) {
            #err(#CanisterCallError(Error.message(e)))
        }
    };
    
    // Make generic JSON RPC request
    public func makeJsonRpcRequest(
        chainId : ChainId,
        method : Text,
        params : [EthereumAPI.EvmValue],
        evmRpcCanisterId : ?Text
    ) : async EvmResult<JsonRpcResponse> {
        let evmRpc = getEvmRpcCanister(evmRpcCanisterId);
        let chainIdNat = chainIdToNat(chainId);
        
        let request : JsonRpcRequest = {
            jsonrpc = "2.0";
            id = 1;
            method = method;
            params = params;
        };
        
        try {
            let result = await evmRpc.json_rpc_request({
                chainId = chainIdNat;
                request = request;
                provider = ?#Alchemy;
            });
            
            result
        } catch (e) {
            #err(#CanisterCallError(Error.message(e)))
        }
    };
}
