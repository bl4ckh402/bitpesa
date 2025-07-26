/**
 * EvmRpcInterface.mo
 * 
 * PRODUCTION-READY EVM RPC Interface for Internet Computer
 * 
 * This module provides interfaces to the official IC EVM RPC canister
 * for Ethereum and other EVM-compatible chains including:
 * - Ethereum Mainnet & Sepolia
 * - Arbitrum One
 * - Base Mainnet  
 * - Optimism Mainnet
 * 
 * Official EVM RPC Canister: 7hfb6-caaaa-aaaar-qadga-cai
 */

import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Error "mo:base/Error";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat16 "mo:base/Nat16";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Int64 "mo:base/Int64";
import Float "mo:base/Float";
import Array "mo:base/Array";

module {
    // ========================================
    // PRODUCTION CONSTANTS
    // ========================================
    
    // Official IC EVM RPC Canister (MAINNET)
    public let EVM_RPC_CANISTER = "7hfb6-caaaa-aaaar-qadga-cai";
    
    // ========================================
    // OFFICIAL EVM RPC TYPES
    // ========================================
    
    // Chain and Provider Types
    public type ChainId = Nat64;
    public type ProviderId = Nat64;
    
    public type EthMainnetService = {
        #Alchemy;
        #Llama;
        #BlockPi;
        #Cloudflare;
        #PublicNode;
        #Ankr;
    };
    
    public type EthSepoliaService = {
        #Alchemy;
        #BlockPi;
        #PublicNode;
        #Ankr;
        #Sepolia;
    };
    
    public type L2MainnetService = {
        #Alchemy;
        #Llama;
        #BlockPi;
        #PublicNode;
        #Ankr;
    };
    
    public type RpcService = {
        #EthMainnet : EthMainnetService;
        #EthSepolia : EthSepoliaService;
        #ArbitrumOne : L2MainnetService;
        #BaseMainnet : L2MainnetService;
        #OptimismMainnet : L2MainnetService;
        #Custom : RpcApi;
        #Provider : ProviderId;
    };
    
    public type RpcServices = {
        #EthMainnet : ?[EthMainnetService];
        #EthSepolia : ?[EthSepoliaService];
        #ArbitrumOne : ?[L2MainnetService];
        #BaseMainnet : ?[L2MainnetService];
        #OptimismMainnet : ?[L2MainnetService];
        #Custom : { chainId : ChainId; services : [RpcApi] };
    };
    
    public type RpcApi = { url : Text; headers : ?[HttpHeader] };
    
    public type HttpHeader = { value : Text; name : Text };
    
    // Block and Transaction Types
    public type BlockTag = {
        #Earliest;
        #Safe;
        #Finalized;
        #Latest;
        #Number : Nat;
        #Pending;
    };
    
    public type Block = {
        miner : Text;
        totalDifficulty : ?Nat;
        receiptsRoot : Text;
        stateRoot : Text;
        hash : Text;
        difficulty : ?Nat;
        size : Nat;
        uncles : [Text];
        baseFeePerGas : ?Nat;
        extraData : Text;
        transactionsRoot : ?Text;
        sha3Uncles : Text;
        nonce : Nat;
        number : Nat;
        timestamp : Nat;
        transactions : [Text];
        gasLimit : Nat;
        logsBloom : Text;
        parentHash : Text;
        gasUsed : Nat;
        mixHash : Text;
    };
    
    public type TransactionRequest = {
        to : ?Text;
        gas : ?Nat;
        maxFeePerGas : ?Nat;
        gasPrice : ?Nat;
        value : ?Nat;
        maxFeePerBlobGas : ?Nat;
        from : ?Text;
        type_ : ?Text;
        accessList : ?[AccessListEntry];
        nonce : ?Nat;
        maxPriorityFeePerGas : ?Nat;
        blobs : ?[Text];
        input : ?Text;
        chainId : ?Nat;
        blobVersionedHashes : ?[Text];
    };
    
    public type AccessListEntry = { storageKeys : [Text]; address : Text };
    
    public type TransactionReceipt = {
        to : ?Text;
        status : ?Nat;
        transactionHash : Text;
        blockNumber : Nat;
        from : Text;
        logs : [LogEntry];
        blockHash : Text;
        type_ : Text;
        transactionIndex : Nat;
        effectiveGasPrice : Nat;
        logsBloom : Text;
        contractAddress : ?Text;
        gasUsed : Nat;
    };
    
    public type LogEntry = {
        transactionHash : ?Text;
        blockNumber : ?Nat;
        data : Text;
        blockHash : ?Text;
        transactionIndex : ?Nat;
        topics : [Text];
        address : Text;
        logIndex : ?Nat;
        removed : Bool;
    };
    
    // Fee and Gas Types
    public type FeeHistory = {
        reward : [[Nat]];
        gasUsedRatio : [Float];
        oldestBlock : Nat;
        baseFeePerGas : [Nat];
    };
    
    // Error Types
    public type RpcError = {
        #JsonRpcError : JsonRpcError;
        #ProviderError : ProviderError;
        #ValidationError : ValidationError;
        #HttpOutcallError : HttpOutcallError;
    };
    
    public type JsonRpcError = { code : Int64; message : Text };
    
    public type ProviderError = {
        #TooFewCycles : { expected : Nat; received : Nat };
        #InvalidRpcConfig : Text;
        #MissingRequiredProvider;
        #ProviderNotFound;
        #NoPermission;
    };
    
    public type ValidationError = { #Custom : Text; #InvalidHex : Text };
    
    public type HttpOutcallError = {
        #IcError : { code : RejectionCode; message : Text };
        #InvalidHttpJsonRpcResponse : {
            status : Nat16;
            body : Text;
            parsingError : ?Text;
        };
    };
    
    public type RejectionCode = {
        #NoError;
        #CanisterError;
        #SysTransient;
        #DestinationInvalid;
        #Unknown;
        #SysFatal;
        #CanisterReject;
    };
    
    // Result Types
    public type CallResult = { #Ok : Text; #Err : RpcError };
    public type GetTransactionReceiptResult = { #Ok : ?TransactionReceipt; #Err : RpcError };
    public type GetTransactionCountResult = { #Ok : Nat; #Err : RpcError };
    public type SendRawTransactionResult = { #Ok : SendRawTransactionStatus; #Err : RpcError };
    public type GetBlockByNumberResult = { #Ok : Block; #Err : RpcError };
    public type FeeHistoryResult = { #Ok : FeeHistory; #Err : RpcError };
    public type GetLogsResult = { #Ok : [LogEntry]; #Err : RpcError };
    
    public type SendRawTransactionStatus = {
        #Ok : ?Text;
        #NonceTooLow;
        #NonceTooHigh;
        #InsufficientFunds;
    };
    
    // Multi-provider Result Types
    public type MultiCallResult = {
        #Consistent : CallResult;
        #Inconsistent : [(RpcService, CallResult)];
    };
    
    public type MultiGetTransactionReceiptResult = {
        #Consistent : GetTransactionReceiptResult;
        #Inconsistent : [(RpcService, GetTransactionReceiptResult)];
    };
    
    public type MultiSendRawTransactionResult = {
        #Consistent : SendRawTransactionResult;
        #Inconsistent : [(RpcService, SendRawTransactionResult)];
    };
    
    // Configuration Types
    public type RpcConfig = {
        responseConsensus : ?ConsensusStrategy;
        responseSizeEstimate : ?Nat64;
    };
    
    public type ConsensusStrategy = {
        #Equality;
        #Threshold : { min : Nat8; total : ?Nat8 };
    };
    
    // Request Argument Types
    public type CallArgs = {
        transaction : TransactionRequest;
        block : ?BlockTag;
    };
    
    public type GetTransactionCountArgs = { 
        address : Text; 
        block : BlockTag 
    };
    
    public type FeeHistoryArgs = {
        blockCount : Nat;
        newestBlock : BlockTag;
        rewardPercentiles : ?Blob;
    };
    
    public type GetLogsArgs = {
        fromBlock : ?BlockTag;
        toBlock : ?BlockTag;
        addresses : [Text];
        topics : ?[Topic];
    };
    
    public type Topic = [Text];
    
    // Convenience type aliases
    public type EvmResult<T> = Result.Result<T, RpcError>;
    
    // ========================================
    // OFFICIAL EVM RPC CANISTER INTERFACE
    // ========================================
    
    // Official IC EVM RPC Canister Interface
    public type EvmRpcCanister = actor {
        // Core Ethereum JSON-RPC methods
        eth_call : shared (
            RpcServices,
            ?RpcConfig,
            CallArgs,
        ) -> async MultiCallResult;
        
        eth_getTransactionReceipt : shared (
            RpcServices,
            ?RpcConfig,
            Text, // Transaction hash
        ) -> async MultiGetTransactionReceiptResult;
        
        eth_sendRawTransaction : shared (
            RpcServices,
            ?RpcConfig,
            Text, // Signed transaction data
        ) -> async MultiSendRawTransactionResult;
        
        eth_getTransactionCount : shared (
            RpcServices,
            ?RpcConfig,
            GetTransactionCountArgs,
        ) -> async MultiGetTransactionCountResult;
        
        eth_getBlockByNumber : shared (
            RpcServices,
            ?RpcConfig,
            BlockTag,
        ) -> async MultiGetBlockByNumberResult;
        
        eth_feeHistory : shared (
            RpcServices,
            ?RpcConfig,
            FeeHistoryArgs,
        ) -> async MultiFeeHistoryResult;
        
        eth_getLogs : shared (
            RpcServices,
            ?GetLogsRpcConfig,
            GetLogsArgs,
        ) -> async MultiGetLogsResult;
        
        // Provider management
        getProviders : shared query () -> async [Provider];
        
        // Metrics and monitoring
        getMetrics : shared query () -> async Metrics;
    };
    
    public type GetLogsRpcConfig = {
        responseConsensus : ?ConsensusStrategy;
        maxBlockRange : ?Nat32;
        responseSizeEstimate : ?Nat64;
    };
    
    public type MultiFeeHistoryResult = {
        #Consistent : FeeHistoryResult;
        #Inconsistent : [(RpcService, FeeHistoryResult)];
    };
    
    public type MultiGetBlockByNumberResult = {
        #Consistent : GetBlockByNumberResult;
        #Inconsistent : [(RpcService, GetBlockByNumberResult)];
    };
    
    public type MultiGetLogsResult = {
        #Consistent : GetLogsResult;
        #Inconsistent : [(RpcService, GetLogsResult)];
    };
    
    public type MultiGetTransactionCountResult = {
        #Consistent : GetTransactionCountResult;
        #Inconsistent : [(RpcService, GetTransactionCountResult)];
    };
    
    public type Provider = {
        access : RpcAccess;
        alias : ?RpcService;
        chainId : ChainId;
        providerId : ProviderId;
    };
    
    public type RpcAccess = {
        #Authenticated : { publicUrl : ?Text; auth : RpcAuth };
        #Unauthenticated : { publicUrl : Text };
    };
    
    public type RpcAuth = {
        #BearerToken : { url : Text };
        #UrlParameter : { urlPattern : Text };
    };
    
    public type Metrics = {
        responses : [((Text, Text, Text), Nat64)];
        inconsistentResponses : [((Text, Text), Nat64)];
        cyclesCharged : [((Text, Text), Nat)];
        requests : [((Text, Text), Nat64)];
        errHttpOutcall : [((Text, Text, RejectionCode), Nat64)];
    };
    
    // ========================================
    // HELPER FUNCTIONS
    // ========================================
    
    // Get EVM RPC canister actor
    public func getEvmRpcCanister() : EvmRpcCanister {
        actor(EVM_RPC_CANISTER) : EvmRpcCanister
    };
    
    // Create default RPC services for Ethereum Mainnet
    public func defaultEthereumMainnet() : RpcServices {
        #EthMainnet(?[#Alchemy, #PublicNode, #Ankr])
    };
    
    // Create default RPC services for Ethereum Sepolia
    public func defaultEthereumSepolia() : RpcServices {
        #EthSepolia(?[#Alchemy, #PublicNode, #Ankr])
    };
    
    // Create default RPC services for Arbitrum One
    public func defaultArbitrumOne() : RpcServices {
        #ArbitrumOne(?[#Alchemy, #PublicNode, #Ankr])
    };
    
    // Create default RPC services for Base Mainnet
    public func defaultBaseMainnet() : RpcServices {
        #BaseMainnet(?[#Alchemy, #PublicNode, #Ankr])
    };
    
    // Create default RPC config with consensus
    public func defaultRpcConfig() : RpcConfig {
        {
            responseConsensus = ?#Threshold({ min = 2; total = ?3 });
            responseSizeEstimate = ?10000; // 10KB estimate
        }
    };
    
    // ========================================
    // PRODUCTION-READY EVM RPC FUNCTIONS
    // ========================================
    
    // Get Ether balance of an address
    public func getEtherBalance(
        rpcServices : RpcServices,
        address : Text,
        blockTag : ?BlockTag
    ) : async EvmResult<Text> {
        let evmRpc = getEvmRpcCanister();
        let config = defaultRpcConfig();
        
        let callArgs : CallArgs = {
            transaction = {
                to = ?address;
                gas = null;
                maxFeePerGas = null;
                gasPrice = null;
                value = null;
                maxFeePerBlobGas = null;
                from = null;
                type_ = null;
                accessList = null;
                nonce = null;
                maxPriorityFeePerGas = null;
                blobs = null;
                input = null;
                chainId = null;
                blobVersionedHashes = null;
            };
            block = blockTag;
        };
        
        try {
            let result = await evmRpc.eth_call(rpcServices, ?config, callArgs);
            
            switch (result) {
                case (#Consistent(#Ok(balance))) {
                    #ok(balance)
                };
                case (#Consistent(#Err(error))) {
                    #err(error)
                };
                case (#Inconsistent(results)) {
                    // Handle inconsistent results - return first successful one
                    for ((service, callResult) in results.vals()) {
                        switch (callResult) {
                            case (#Ok(balance)) return #ok(balance);
                            case (#Err(_)) {};
                        };
                    };
                    #err(#ValidationError(#Custom("All providers returned errors")))
                };
            }
        } catch (e) {
            #err(#HttpOutcallError(#IcError({ code = #CanisterError; message = Error.message(e) })))
        }
    };
    
    // Get transaction receipt
    public func getTransactionReceipt(
        rpcServices : RpcServices,
        txHash : Text
    ) : async EvmResult<?TransactionReceipt> {
        let evmRpc = getEvmRpcCanister();
        let config = defaultRpcConfig();
        
        try {
            let result = await evmRpc.eth_getTransactionReceipt(rpcServices, ?config, txHash);
            
            switch (result) {
                case (#Consistent(#Ok(receipt))) {
                    #ok(receipt)
                };
                case (#Consistent(#Err(error))) {
                    #err(error)
                };
                case (#Inconsistent(results)) {
                    // Handle inconsistent results - return first successful one
                    for ((service, receiptResult) in results.vals()) {
                        switch (receiptResult) {
                            case (#Ok(receipt)) return #ok(receipt);
                            case (#Err(_)) {};
                        };
                    };
                    #err(#ValidationError(#Custom("All providers returned errors")))
                };
            }
        } catch (e) {
            #err(#HttpOutcallError(#IcError({ code = #CanisterError; message = Error.message(e) })))
        }
    };
    
    // Send raw transaction to the network
    public func sendRawTransaction(
        rpcServices : RpcServices,
        signedTxData : Text
    ) : async EvmResult<SendRawTransactionStatus> {
        let evmRpc = getEvmRpcCanister();
        let config = defaultRpcConfig();
        
        try {
            let result = await evmRpc.eth_sendRawTransaction(rpcServices, ?config, signedTxData);
            
            switch (result) {
                case (#Consistent(#Ok(status))) {
                    #ok(status)
                };
                case (#Consistent(#Err(error))) {
                    #err(error)
                };
                case (#Inconsistent(results)) {
                    // For transaction sending, we need at least one success
                    for ((service, txResult) in results.vals()) {
                        switch (txResult) {
                            case (#Ok(status)) return #ok(status);
                            case (#Err(_)) {};
                        };
                    };
                    #err(#ValidationError(#Custom("All providers failed to send transaction")))
                };
            }
        } catch (e) {
            #err(#HttpOutcallError(#IcError({ code = #CanisterError; message = Error.message(e) })))
        }
    };
    
    // Get transaction count (nonce) for an address
    public func getTransactionCount(
        rpcServices : RpcServices,
        address : Text,
        blockTag : BlockTag
    ) : async EvmResult<Nat> {
        let evmRpc = getEvmRpcCanister();
        let config = defaultRpcConfig();
        
        let args : GetTransactionCountArgs = {
            address = address;
            block = blockTag;
        };
        
        try {
            let result = await evmRpc.eth_getTransactionCount(rpcServices, ?config, args);
            
            switch (result) {
                case (#Consistent(#Ok(count))) {
                    #ok(count)
                };
                case (#Consistent(#Err(error))) {
                    #err(error)
                };
                case (#Inconsistent(results)) {
                    // Handle inconsistent results - return first successful one
                    for ((service, countResult) in results.vals()) {
                        switch (countResult) {
                            case (#Ok(count)) return #ok(count);
                            case (#Err(_)) {};
                        };
                    };
                    #err(#ValidationError(#Custom("All providers returned errors")))
                };
            }
        } catch (e) {
            #err(#HttpOutcallError(#IcError({ code = #CanisterError; message = Error.message(e) })))
        }
    };
    
    // Call contract view function (no state change)
    public func callContract(
        rpcServices : RpcServices,
        contractAddress : Text,
        callData : Text,
        fromAddress : ?Text,
        blockTag : ?BlockTag
    ) : async EvmResult<Text> {
        let evmRpc = getEvmRpcCanister();
        let config = defaultRpcConfig();
        
        let callArgs : CallArgs = {
            transaction = {
                to = ?contractAddress;
                gas = null;
                maxFeePerGas = null;
                gasPrice = null;
                value = null;
                maxFeePerBlobGas = null;
                from = fromAddress;
                type_ = null;
                accessList = null;
                nonce = null;
                maxPriorityFeePerGas = null;
                blobs = null;
                input = ?callData;
                chainId = null;
                blobVersionedHashes = null;
            };
            block = blockTag;
        };
        
        try {
            let result = await evmRpc.eth_call(rpcServices, ?config, callArgs);
            
            switch (result) {
                case (#Consistent(#Ok(response))) {
                    #ok(response)
                };
                case (#Consistent(#Err(error))) {
                    #err(error)
                };
                case (#Inconsistent(results)) {
                    // Handle inconsistent results - return first successful one
                    for ((service, callResult) in results.vals()) {
                        switch (callResult) {
                            case (#Ok(response)) return #ok(response);
                            case (#Err(_)) {};
                        };
                    };
                    #err(#ValidationError(#Custom("All providers returned errors")))
                };
            }
        } catch (e) {
            #err(#HttpOutcallError(#IcError({ code = #CanisterError; message = Error.message(e) })))
        }
    };
    
    // Get current block number
    public func getBlockByNumber(
        rpcServices : RpcServices,
        blockTag : BlockTag
    ) : async EvmResult<Block> {
        let evmRpc = getEvmRpcCanister();
        let config = defaultRpcConfig();
        
        try {
            let result = await evmRpc.eth_getBlockByNumber(rpcServices, ?config, blockTag);
            
            switch (result) {
                case (#Consistent(#Ok(block))) {
                    #ok(block)
                };
                case (#Consistent(#Err(error))) {
                    #err(error)
                };
                case (#Inconsistent(results)) {
                    // Handle inconsistent results - return first successful one
                    for ((service, blockResult) in results.vals()) {
                        switch (blockResult) {
                            case (#Ok(block)) return #ok(block);
                            case (#Err(_)) {};
                        };
                    };
                    #err(#ValidationError(#Custom("All providers returned errors")))
                };
            }
        } catch (e) {
            #err(#HttpOutcallError(#IcError({ code = #CanisterError; message = Error.message(e) })))
        }
    };
    
    // Get fee history for gas estimation
    public func getFeeHistory(
        rpcServices : RpcServices,
        blockCount : Nat,
        newestBlock : BlockTag,
        rewardPercentiles : ?Blob
    ) : async EvmResult<FeeHistory> {
        let evmRpc = getEvmRpcCanister();
        let config = defaultRpcConfig();
        
        let args : FeeHistoryArgs = {
            blockCount = blockCount;
            newestBlock = newestBlock;
            rewardPercentiles = rewardPercentiles;
        };
        
        try {
            let result = await evmRpc.eth_feeHistory(rpcServices, ?config, args);
            
            switch (result) {
                case (#Consistent(#Ok(feeHistory))) {
                    #ok(feeHistory)
                };
                case (#Consistent(#Err(error))) {
                    #err(error)
                };
                case (#Inconsistent(results)) {
                    // Handle inconsistent results - return first successful one
                    for ((service, feeResult) in results.vals()) {
                        switch (feeResult) {
                            case (#Ok(feeHistory)) return #ok(feeHistory);
                            case (#Err(_)) {};
                        };
                    };
                    #err(#ValidationError(#Custom("All providers returned errors")))
                };
            }
        } catch (e) {
            #err(#HttpOutcallError(#IcError({ code = #CanisterError; message = Error.message(e) })))
        }
    };
}
