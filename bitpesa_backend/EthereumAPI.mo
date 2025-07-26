/**
 * EthereumAPI.mo
 * 
 * This module provides integration with Ethereum and EVM chains through the EVM RPC canister.
 * It enables:
 * - USDC balance checking
 * - USDC transfers to user addresses
 * - Chain-key signature generation for Ethereum transactions
 * - ERC-20 token interactions
 */

import Blob "mo:base/Blob";
import Nat64 "mo:base/Nat64";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Principal "mo:base/Principal";
import Error "mo:base/Error";
import Text "mo:base/Text";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Management "../bitpesa_backend/Management";
import Time "mo:base/Time";
import Iter "mo:base/Iter";

module {
    // ===============================
    // EVM RPC Types
    // ===============================
    
    public type Chain = {
        #Ethereum;
        #Arbitrum;
        #Base;
        #Optimism;
    };

    public type ChainId = {
        #Ethereum_Mainnet : Nat; // 1
        #Arbitrum_One : Nat;     // 42161
        #Base_Mainnet : Nat;     // 8453
        #Optimism_Mainnet : Nat; // 10
        #Ethereum_Sepolia : Nat; // 11155111 (testnet)
        #Custom : Nat;           // For other chains
    };
    
    public type Provider = {
        #Alchemy;
        #Ankr;
        #BlockPi;
        #Cloudflare; // Ethereum only
        #LlamaNodes;
        #PublicNode;
        #Custom : Text; // Custom provider URL
    };

    public type EvmAddress = Text; // Hex string with 0x prefix
    public type TokenAmount = Nat; // Token amount with decimals
    
    public type TransactionHash = Text; // Hex string with 0x prefix
    public type BlockNumber = { #Latest; #Earliest; #Pending; #Number : Nat };
    
    // EVM RPC Request/Response types
    public type EvmRpcRequest = {
        jsonrpc : Text;
        id : Nat;
        method : Text;
        params : [EvmValue];
    };
    
    public type EvmValue = {
        #String : Text;
        #Number : Nat;
        #Bool : Bool;
        #Null;
        #Array : [EvmValue];
        #Object : [(Text, EvmValue)];
    };
    
    public type EvmRpcResponse = {
        id : Nat;
        jsonrpc : Text;
        result : ?EvmValue;
        error : ?{
            code : Int;
            message : Text;
        };
    };

    // ERC-20 Types
    public type Erc20TokenConfig = {
        chainId : ChainId;
        contractAddress : EvmAddress;
        decimals : Nat8;
        symbol : Text;
    };

    // Default USDC on Ethereum
    public let USDC_ETHEREUM : Erc20TokenConfig = {
        chainId = #Ethereum_Mainnet(1);
        contractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Ethereum mainnet USDC
        decimals = 6;
        symbol = "USDC";
    };

    // Default EVM RPC Canister principal
    private let DEFAULT_EVM_RPC_CANISTER_ID = "7hfb6-caaaa-aaaar-qadga-cai";

    // Error types
    public type EvmError = {
        #HttpError : Text;
        #DeserializationError : Text;
        #EvmRpcError : { code : Int; message : Text };
        #InvalidAddress : Text;
        #InvalidAmount : Text;
        #InsufficientFunds : Text;
        #TransactionFailed : Text;
        #ChainKeySigningError : Text;
        #CanisterCallError : Text;
        #InvalidResponse : Text;
        #Other : Text;
    };

    // Type aliases
    public type EvmResult<T> = Result.Result<T, EvmError>;
    
    // Management Canister Interface for HTTP Outcalls
    private type EvmRpcCanister = actor {
        // eth_getBalance method
        eth_call : (request : {
            chainId : Nat;
            to : Text;             // Contract address
            from : ?Text;          // Optional sender address
            data : Text;           // Encoded function call
            provider : ?Provider;  // Optional specific provider
        }) -> async EvmResult<Text>; // Returns hex string
        
        // eth_sendRawTransaction method
        eth_sendRawTransaction : (request : {
            chainId : Nat;
            transaction : Text;     // Signed transaction data
            provider : ?Provider;   // Optional specific provider
        }) -> async EvmResult<TransactionHash>;
        
        // Generic RPC call method
        call : (request : {
            chainId : Nat;
            method : Text;
            params : [EvmValue];
            provider : ?Provider;
        }) -> async EvmResult<EvmValue>;
    };
    
    // Threshold ECDSA Key Management
    private type EcdsaKeyId = { 
        #MainNet; 
        #TestNet;
    };
    
    private type SignWithECDSAReply = {
        signature : Blob;
    };
    
    private type SignWithECDSARequest = {
        message_hash : Blob;
        derivation_path : [Blob];
        key_id : EcdsaKeyId;
    };
    
    private type ManagementCanister = actor {
        // Threshold ECDSA signature generation
        sign_with_ecdsa : (SignWithECDSARequest) -> async SignWithECDSAReply;
        ecdsa_public_key : (request : {
            canister_id : ?Principal;
            derivation_path : [Blob];
            key_id : EcdsaKeyId;
        }) -> async { 
            public_key : Blob;
            chain_code : Blob;
        };
    };
    
    private let IC : ManagementCanister = actor "aaaaa-aa";
    
    // ===================================
    // Helper Functions
    // ===================================
    
    // Convert chain ID enum to numeric value
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
    
    // Get the EVM RPC canister actor
    private func getEvmRpcCanister(canisterId : ?Text) : EvmRpcCanister {
        let id = switch (canisterId) {
            case (null) DEFAULT_EVM_RPC_CANISTER_ID;
            case (?id) id;
        };
        
        actor(id) : EvmRpcCanister;
    };
    
    // Create Ethereum address from ECDSA public key
    public func publicKeyToEvmAddress(publicKey : [Nat8]) : EvmResult<EvmAddress> {
        if (publicKey.size() != 33 and publicKey.size() != 65) {
            return #err(#InvalidAddress("Invalid public key length"));
        };
        
        // TODO: Implement proper Keccak-256 hashing and address derivation
        // For now, we return a placeholder implementation
        #ok("0x" # "PlaceholderEthereumAddressFromPublicKey");
    };
    
    // ===================================
    // ERC-20 Token Functions
    // ===================================
    
    // Function ID for ERC-20 balanceOf(address)
    private let BALANCE_OF_FUNC_ID = "70a08231";
    
    // Function ID for ERC-20 transfer(address,uint256)
    private let TRANSFER_FUNC_ID = "a9059cbb";
    
    // Helper function to pad a string with zeros on the right
    private func padRight(text : Text, targetLength : Nat, padChar : Char) : Text {
        let currentLength = text.size();
        if (currentLength >= targetLength) {
            return text;
        };
        
        let paddingNeeded = targetLength - currentLength;
        var padding = "";
        for (i in Iter.range(0, paddingNeeded - 1)) {
            padding := padding # Text.fromChar(padChar);
        };
        
        text # padding;
    };

    // Get ERC-20 token balance
    public func getErc20Balance(
        token : Erc20TokenConfig,
        address : EvmAddress,
        evmRpcCanisterId : ?Text
    ) : async EvmResult<TokenAmount> {
        let evmRpc = getEvmRpcCanister(evmRpcCanisterId);
        
        // Create the ERC-20 balanceOf function call data
        // balanceOf(address) = 0x70a08231 + address (padded to 32 bytes)
        let addressNoPadding = if (Text.startsWith(address, #text("0x"))) {
            Text.trimStart(address, #text("0x"));
        } else {
            address;
        };
        
        let paddedAddress = padRight(addressNoPadding, 64, '0');
        let callData = "0x" # BALANCE_OF_FUNC_ID # paddedAddress;
        
        let chainId = chainIdToNat(token.chainId);
        
        try {
            let result = await evmRpc.eth_call({
                chainId = chainId;
                to = token.contractAddress;
                from = null;
                data = callData;
                provider = ?#Alchemy; // Default to Alchemy
            });
            
            switch (result) {
                case (#ok(hexBalance)) {
                    // Convert hex string to Nat
                    let cleanHex = Text.trimStart(hexBalance, #text("0x"));
                    // TODO: Implement proper hex to Nat conversion
                    // For now, returning a placeholder value
                    #ok(100_000_000); // 100 USDC (with 6 decimals)
                };
                case (#err(e)) {
                    #err(e);
                };
            };
        } catch (e) {
            #err(#CanisterCallError(Error.message(e)));
        };
    };
    
    // Send ERC-20 tokens from canister's Ethereum address to another address
    public func sendErc20Tokens(
        token : Erc20TokenConfig,
        toAddress : EvmAddress,
        amount : TokenAmount,
        evmRpcCanisterId : ?Text
    ) : async EvmResult<TransactionHash> {
        let evmRpc = getEvmRpcCanister(evmRpcCanisterId);
        
        // TODO: Implement full ERC-20 transfer flow with threshold ECDSA signatures
        // This is a placeholder implementation that would need chain-key signing
        
        try {
            // For demonstration purposes we're returning a placeholder transaction hash
            // In a real implementation, this would:
            // 1. Create an unsigned ERC-20 transfer transaction
            // 2. Sign it with threshold ECDSA
            // 3. Send the signed transaction to the EVM network
            #ok("0xplaceholderTransactionHashForErc20Transfer");
        } catch (e) {
            #err(#CanisterCallError(Error.message(e)));
        };
    };
    
    // ===================================
    // Chain Fusion Integration Functions
    // ===================================
    
    // Convert ICP ckUSDC to native USDC on Ethereum through Chain Fusion
    public func convertCkUsdcToEthereumUsdc(
        recipient : EvmAddress,
        amount : TokenAmount
    ) : async EvmResult<TransactionHash> {
        // This function would integrate with the Chain Fusion system
        // to convert ckUSDC tokens on ICP to native USDC on Ethereum
        
        // Placeholder implementation
        #ok("0xChainFusionConversionTxHash");
    };
    
    // Get Ethereum address for this canister (using threshold ECDSA)
    public func getCanisterEthereumAddress() : async EvmResult<EvmAddress> {
        // Create a derivation path for the canister's Ethereum address
        let derivation_path = [Blob.fromArray([0])]; // Simple derivation path
        
        try {
            // Request ECDSA public key from the IC
            let publicKeyResult = await IC.ecdsa_public_key({
                canister_id = null; // Use this canister's ID
                derivation_path = derivation_path;
                key_id = #MainNet; // Use mainnet key
            });
            
            // Convert public key to Ethereum address
            // In a real implementation, this would perform Keccak-256 hashing
            let publicKey = Blob.toArray(publicKeyResult.public_key);
            
            // For now return a placeholder Ethereum address
            #ok("0x1234567890123456789012345678901234567890");
        } catch (e) {
            #err(#ChainKeySigningError(Error.message(e)));
        };
    };
}
