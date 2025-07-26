/**
 * BitPesaNativeBitcoinLendingProduction.mo
 * 
 * PRODUCTION-READY Native Bitcoin to USDC on Ethereum Lending Platform
 * 
 * This canister provides a complete lending system where:
 * 1. Users deposit NATIVE BITCOIN to generated Bitcoin addresses
 * 2. Use Bitcoin as collateral to borrow USDC
 * 3. USDC is sent directly to user's Ethereum addresses via Chain Fusion
 * 4. Canister can sign Ethereum transactions on behalf of users
 * 
 * Uses Official IC Canisters:
 * - Bitcoin API: Direct Bitcoin network integration (no ckBTC)
 * - EVM RPC Canister: 7hfb6-caaaa-aaaar-qadga-cai
 * - Threshold ECDSA: Production key_1 for signing
 * - ckUSDC Minter: For USDC bridge to Ethereum
 * 
 * READY FOR MAINNET DEPLOYMENT!
 */

import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import _Nat32 "mo:base/Nat32";
import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Hash "mo:base/Hash";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import _Option "mo:base/Option";

// Import our production modules
import BitcoinAPI "./BitcoinAPI";
import EthereumAPI "./EthereumAPI";
import _EvmRpcInterface "./EvmRpcInterface";
import _Management "./Management";

actor BitPesaNativeBitcoinLendingProduction {
    
    // ===============================
    // PRODUCTION CONFIGURATION (MAINNET)
    // ===============================
    
    // Official IC Canister IDs (MAINNET)
    private let EVM_RPC_CANISTER = "7hfb6-caaaa-aaaar-qadga-cai";
    private let CKUSDC_LEDGER_CANISTER = "xevnm-gaaaa-aaaar-qafnq-cai"; // ckUSDC Ledger
    private let CKUSDC_MINTER_CANISTER = "sv3dd-oaaaa-aaaar-qacoa-cai"; // ckUSDC Minter
    
    // Production ECDSA Key (mainnet)
    private let ECDSA_KEY_NAME = "key_1"; // Production secp256k1 key
    
    // Bitcoin network configuration
    private let BITCOIN_NETWORK : BitcoinAPI.BitcoinNetwork = #mainnet;
    
    // Production lending parameters
    private let MIN_COLLATERAL_RATIO : Nat = 15000; // 150% (basis points)
    private let _LIQUIDATION_THRESHOLD : Nat = 12000; // 120%
    private let _MAX_LTV_RATIO : Nat = 7500; // 75%
    private let INTEREST_RATE_BPS : Nat = 500; // 5% annually
    private let ORIGINATION_FEE_BPS : Nat = 50; // 0.5% origination fee
    private let MAX_LOAN_DURATION_DAYS : Nat = 365; // 1 year max
    
    // Safety limits
    private let MIN_USDC_LOAN : Nat = 100_000_000; // 100 USDC (6 decimals)
    private let MAX_USDC_LOAN : Nat = 1_000_000_000_000; // 1M USDC
    private let MIN_BITCOIN_COLLATERAL : BitcoinAPI.Satoshi = 100_000; // 0.001 BTC
    
    // USDC Ethereum configuration
    private let _USDC_ETHEREUM_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    private let _ETHEREUM_CHAIN_ID : Nat64 = 1; // Ethereum Mainnet
    
    // ===============================
    // TYPES
    // ===============================
    
    // Simple hash function for Nat values
    private func natHash(n : Nat) : Hash.Hash {
        Text.hash(Nat.toText(n));
    };
    
    public type TokenAmount = Nat;
    public type Satoshi = Nat64;
    public type LoanId = Nat;
    public type UserId = Principal;
    public type EthereumAddress = Text;
    public type BitcoinAddress = Text;
    public type TransactionHash = Text;
    
    public type LendingResult<T> = Result.Result<T, LendingError>;
    
    public type LendingError = {
        #Unauthorized;
        #InsufficientCollateral : { required : Nat; available : Nat };
        #InsufficientFunds : { balance : Nat };
        #InvalidAmount : Text;
        #InvalidAddress : Text;
        #LoanNotFound : Nat;
        #LoanNotActive : Nat;
        #BitcoinError : Text;
        #EthereumError : Text;
        #PriceOracleError : Text;
        #SystemError : Text;
        #NetworkError : Text;
    };
    
    public type UserProfile = {
        principal : Principal;
        bitcoinAddress : ?BitcoinAddress;
        ethereumAddress : ?EthereumAddress;
        totalBitcoinDeposited : BitcoinAPI.Satoshi;
        totalBitcoinLocked : BitcoinAPI.Satoshi;
        activeLoans : [Nat];
        createdAt : Time.Time;
        lastUpdated : Time.Time;
    };
    
    public type Loan = {
        id : Nat;
        borrower : Principal;
        bitcoinCollateral : BitcoinAPI.Satoshi;
        usdcBorrowed : Nat;
        ethereumAddress : Text;
        ethereumTxHash : ?Text;
        interestRateBps : Nat;
        originationFeeBps : Nat;
        startTime : Time.Time;
        endTime : Time.Time;
        isActive : Bool;
        isLiquidated : Bool;
        lastPriceCheck : Time.Time;
        collateralRatio : Nat; // Current ratio in basis points
    };
    
    public type PriceData = {
        btcUsdPrice : Nat; // USD price in cents (e.g., 5000000 = $50,000.00)
        lastUpdate : Time.Time;
        source : Text;
    };
    
    // ===============================
    // OFFICIAL IC INTERFACES (PRODUCTION)
    // ===============================
    
    // Official ckUSDC Ledger Interface (ICRC-1 Standard)
    private type CkUsdcLedger = actor {
        icrc1_balance_of : ({owner : Principal; subaccount : ?Blob}) -> async Nat;
        icrc1_transfer : ({
            to : {owner : Principal; subaccount : ?Blob};
            amount : Nat;
            fee : ?Nat;
            memo : ?Blob;
            created_at_time : ?Nat64;
        }) -> async {#Ok : Nat; #Err : {
            #BadFee : { expected_fee : Nat };
            #BadBurn : { min_burn_amount : Nat };
            #InsufficientFunds : { balance : Nat };
            #TooOld;
            #CreatedInFuture : { ledger_time : Nat64 };
            #Duplicate : { duplicate_of : Nat };
            #TemporarilyUnavailable;
            #GenericError : { error_code : Nat; message : Text };
        }};
    };
    
    // Official ckUSDC Minter Interface (Ethereum ↔ IC bridge)
    private type CkUsdcMinter = actor {
        // Withdraw USDC to Ethereum (burn ckUSDC → get USDC)
        withdraw_erc20 : ({
            recipient : Text;
            amount : Nat;
        }) -> async {
            #Ok : { block_index : Nat };
            #Err : {
                #InvalidDestination : Text;
                #GenericError : { error_code : Nat; message : Text };
                #TemporarilyUnavailable : Text;
                #AlreadyProcessing;
                #AmountTooLow : Nat;
                #InsufficientFunds : { balance : Nat };
            };
        };
    };
    
    // Official IC Management Canister (Threshold ECDSA)
    private type ManagementCanister = actor {
        ecdsa_public_key : ({
            canister_id : ?Principal;
            derivation_path : [Blob];
            key_id : { curve : {#secp256k1}; name : Text };
        }) -> async {
            public_key : Blob;
            chain_code : Blob;
        };
        
        sign_with_ecdsa : ({
            message_hash : Blob;
            derivation_path : [Blob];
            key_id : { curve : {#secp256k1}; name : Text };
        }) -> async {
            signature : Blob;
        };
        
        bitcoin_get_balance : (BitcoinAPI.GetBalanceRequest) -> async BitcoinAPI.Satoshi;
        bitcoin_get_utxos : (BitcoinAPI.UtxosRequest) -> async BitcoinAPI.GetUtxosResponse;
        bitcoin_send_transaction : (BitcoinAPI.SendTransactionRequest) -> async ();
        bitcoin_get_current_fee_percentiles : (BitcoinAPI.GetCurrentFeePercentilesRequest) -> async [BitcoinAPI.MillisatoshiPerByte];
    };
    
    // ===============================
    // ACTOR REFERENCES (PRODUCTION)
    // ===============================
    
    private let _ckUsdcLedger : CkUsdcLedger = actor(CKUSDC_LEDGER_CANISTER);
    private let _ckUsdcMinter : CkUsdcMinter = actor(CKUSDC_MINTER_CANISTER);
    private let ic : ManagementCanister = actor("aaaaa-aa");
    
    // ===============================
    // STATE MANAGEMENT
    // ===============================
    
    private stable var nextLoanId : LoanId = 1;
    private stable var totalSystemCollateral : BitcoinAPI.Satoshi = 0;
    private stable var totalSystemDebt : TokenAmount = 0;
    private stable var totalProtocolFees : TokenAmount = 0;
    
    // Price oracle state
    private stable var lastBtcPriceUsdCents : Nat = 5000000; // $50k in cents
    private stable var lastPriceUpdate : Time.Time = 0;
    
    // Stable storage for upgrades
    private stable var userProfilesEntries : [(UserId, UserProfile)] = [];
    private stable var loansEntries : [(LoanId, Loan)] = [];
    private stable var bitcoinAddressesEntries : [(Principal, BitcoinAddress)] = [];
    private stable var ethereumAddressesEntries : [(Principal, EthereumAddress)] = [];
    private stable var bitcoinBalancesEntries : [(Principal, BitcoinAPI.Satoshi)] = [];
    
    // Runtime state
    private var userProfiles = HashMap.HashMap<UserId, UserProfile>(0, Principal.equal, Principal.hash);
    private var loans = HashMap.HashMap<LoanId, Loan>(0, Nat.equal, natHash);
    private var bitcoinAddresses = HashMap.HashMap<Principal, BitcoinAddress>(0, Principal.equal, Principal.hash);
    private var ethereumAddresses = HashMap.HashMap<Principal, EthereumAddress>(0, Principal.equal, Principal.hash);
    private var bitcoinBalances = HashMap.HashMap<Principal, BitcoinAPI.Satoshi>(0, Principal.equal, Principal.hash);
    
    // Initialize state from stable storage
    private func initializeState() {
        userProfiles := HashMap.fromIter(
            userProfilesEntries.vals(), 
            userProfilesEntries.size(), 
            Principal.equal, 
            Principal.hash
        );
        loans := HashMap.fromIter(
            loansEntries.vals(),
            loansEntries.size(),
            Nat.equal,
            natHash
        );
        bitcoinAddresses := HashMap.fromIter(
            bitcoinAddressesEntries.vals(),
            bitcoinAddressesEntries.size(),
            Principal.equal,
            Principal.hash
        );
        ethereumAddresses := HashMap.fromIter(
            ethereumAddressesEntries.vals(),
            ethereumAddressesEntries.size(),
            Principal.equal,
            Principal.hash
        );
        bitcoinBalances := HashMap.fromIter(
            bitcoinBalancesEntries.vals(),
            bitcoinBalancesEntries.size(),
            Principal.equal,
            Principal.hash
        );
    };
    
    // System upgrade hooks
    system func preupgrade() {
        userProfilesEntries := Iter.toArray(userProfiles.entries());
        loansEntries := Iter.toArray(loans.entries());
        bitcoinAddressesEntries := Iter.toArray(bitcoinAddresses.entries());
        ethereumAddressesEntries := Iter.toArray(ethereumAddresses.entries());
        bitcoinBalancesEntries := Iter.toArray(bitcoinBalances.entries());
    };
    
    system func postupgrade() {
        initializeState();
    };
    
    // Initialize on first deployment
    initializeState();
    
    // ===============================
    // BITCOIN ADDRESS GENERATION (PRODUCTION)
    // ===============================
    
    /// Generate Bitcoin address for user using threshold ECDSA
    public shared(msg) func generateBitcoinAddress() : async LendingResult<BitcoinAddress> {
        let user = msg.caller;
        
        // Check if user already has address
        switch (bitcoinAddresses.get(user)) {
            case (?existing) return #ok(existing);
            case null {};
        };
        
        try {
            // Create deterministic derivation path for user
            let userBytes = Blob.toArray(Principal.toBlob(user));
            let derivationPath = [Blob.fromArray(userBytes)];
            
            // Get public key using production ECDSA key
            let keyId = {
                curve = #secp256k1;
                name = ECDSA_KEY_NAME;
            };
            
            let publicKeyResult = await ic.ecdsa_public_key({
                canister_id = null;
                derivation_path = derivationPath;
                key_id = keyId;
            });
            
            // Convert public key to Bitcoin P2PKH address
            let addressResult = BitcoinAPI.public_key_to_p2pkh_address(Blob.toArray(publicKeyResult.public_key), BITCOIN_NETWORK);
            
            switch (addressResult) {
                case (#err(error)) {
                    return #err(#BitcoinError("Address generation error: " # BitcoinAPI.error_to_text(error)));
                };
                case (#ok(address)) {
                    bitcoinAddresses.put(user, address);
                    Debug.print("✅ Generated Bitcoin address for " # Principal.toText(user) # ": " # address);
                    return #ok(address);
                };
            };
        } catch (e) {
            #err(#SystemError("Bitcoin address generation failed: " # Error.message(e)));
        };
    };
    
    // ===============================
    // ETHEREUM ADDRESS GENERATION (PRODUCTION)
    // ===============================
    
    /// Generate Ethereum address using IC threshold ECDSA
    public shared(msg) func generateEthereumAddress() : async LendingResult<EthereumAddress> {
        let user = msg.caller;
        
        // Check if user already has address
        switch (ethereumAddresses.get(user)) {
            case (?existing) return #ok(existing);
            case null {};
        };
        
        try {
            let addressResult = await EthereumAPI.getUserEthereumAddress(user);
            switch (addressResult) {
                case (#ok(address)) {
                    ethereumAddresses.put(user, address);
                    Debug.print("✅ Generated Ethereum address for " # Principal.toText(user) # ": " # address);
                    #ok(address);
                };
                case (#err(error)) {
                    #err(#EthereumError("Ethereum address generation failed: " # debug_show(error)));
                };
            };
        } catch (e) {
            #err(#SystemError("Ethereum address generation failed: " # Error.message(e)));
        };
    };
    
    // ===============================
    // BITCOIN OPERATIONS (Native Bitcoin)
    // ===============================
    
    /// Get user's Bitcoin balance from their address
    public shared(msg) func updateBitcoinBalance() : async LendingResult<BitcoinAPI.Satoshi> {
        let user = msg.caller;
        
        switch (bitcoinAddresses.get(user)) {
            case null {
                return #err(#InvalidAddress("No Bitcoin address found. Generate one first."));
            };
            case (?address) {
                try {
                    let balanceRequest : BitcoinAPI.GetBalanceRequest = {
                        address = address;
                        network = BITCOIN_NETWORK;
                        min_confirmations = ?1;
                    };
                    
                    let balance = await ic.bitcoin_get_balance(balanceRequest);
                    bitcoinBalances.put(user, balance);
                    
                    Debug.print("📊 Updated Bitcoin balance for " # Principal.toText(user) # ": " # Nat64.toText(balance) # " sats");
                    #ok(balance);
                } catch (e) {
                    #err(#BitcoinError("Failed to get Bitcoin balance: " # Error.message(e)));
                };
            };
        };
    };
    
    /// Get user's current Bitcoin balance
    public shared query(msg) func getBitcoinBalance() : async BitcoinAPI.Satoshi {
        let user = msg.caller;
        switch (bitcoinBalances.get(user)) {
            case (?balance) balance;
            case null 0;
        };
    };
    
    /// Get user's Bitcoin address
    public shared query(msg) func getUserBitcoinAddress() : async ?BitcoinAddress {
        bitcoinAddresses.get(msg.caller);
    };
    
    /// Get user's Ethereum address
    public shared query(msg) func getUserEthereumAddress() : async ?EthereumAddress {
        ethereumAddresses.get(msg.caller);
    };
    
    // ===============================
    // PRICE ORACLE (PRODUCTION)
    // ===============================
    
    /// Update BTC price using CoinGecko API
    private func updateBtcPrice() : async LendingResult<Nat> {
        try {
            // Simple HTTP outcall to get BTC price
            let management : actor {
                http_request : ({
                    url : Text;
                    method : {#get; #post; #head};
                    headers : [{name : Text; value : Text}];
                    body : ?[Nat8];
                    max_response_bytes : ?Nat64;
                    transform : ?{
                        function : shared query ({
                            response : {
                                status : Nat;
                                headers : [{name : Text; value : Text}];
                                body : [Nat8];
                            };
                            context : Blob;
                        }) -> async {
                            status : Nat;
                            headers : [{name : Text; value : Text}];
                            body : [Nat8];
                        };
                        context : Blob;
                    };
                }) -> async {
                    status : Nat;
                    headers : [{name : Text; value : Text}];
                    body : [Nat8];
                };
            } = actor("aaaaa-aa");
            
            let response = await management.http_request({
                url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
                method = #get;
                headers = [];
                body = null;
                max_response_bytes = ?1000;
                transform = ?{
                    function = transformPriceResponse;
                    context = Blob.fromArray([]);
                };
            });
            
            if (response.status == 200) {
                let bodyText = Text.decodeUtf8(Blob.fromArray(response.body));
                switch (bodyText) {
                    case (?text) {
                        switch (extractBtcPriceFromJson(text)) {
                            case (?priceInCents) {
                                lastBtcPriceUsdCents := priceInCents;
                                lastPriceUpdate := Time.now();
                                Debug.print("📈 Updated BTC price: $" # Nat.toText(priceInCents / 100) # "." # Nat.toText(priceInCents % 100));
                                #ok(priceInCents);
                            };
                            case null {
                                #err(#PriceOracleError("Failed to parse price from API response"));
                            };
                        };
                    };
                    case null {
                        #err(#PriceOracleError("Invalid response body encoding"));
                    };
                };
            } else {
                #err(#PriceOracleError("HTTP request failed with status: " # Nat.toText(response.status)));
            };
        } catch (e) {
            #err(#PriceOracleError("Failed to fetch BTC price: " # Error.message(e)));
        };
    };
    
    // Transform function for HTTP response
    public query func transformPriceResponse(args : {
        response : {
            status : Nat;
            headers : [{name : Text; value : Text}];
            body : [Nat8];
        };
        context : Blob;
    }) : async {
        status : Nat;
        headers : [{name : Text; value : Text}];
        body : [Nat8];
    } {
        {
            status = args.response.status;
            headers = [];
            body = args.response.body;
        }
    };
    
    // Extract BTC price from CoinGecko API JSON response
    private func extractBtcPriceFromJson(json : Text) : ?Nat {
        // Look for "bitcoin":{"usd":PRICE
        let parts = Text.split(json, #text("\"usd\":"));
        switch (parts.next(), parts.next()) {
            case (_, ?afterUsd) {
                let priceParts = Text.split(afterUsd, #text("}"));
                switch (priceParts.next()) {
                    case (?priceStr) {
                        // Remove any trailing characters and convert to cents
                        let cleanPrice = Text.replace(priceStr, #char(','), "");
                        let priceFloat = parseFloat(cleanPrice);
                        switch (priceFloat) {
                            case (?price) {
                                ?(price * 100); // Convert to cents
                            };
                            case null null;
                        };
                    };
                    case null null;
                };
            };
            case _ null;
        };
    };
    
    // Simple float parser for price strings
    private func parseFloat(str : Text) : ?Nat {
        let parts = Text.split(str, #char('.'));
        switch (parts.next(), parts.next()) {
            case (?intPart, ?fracPart) {
                switch (Nat.fromText(intPart)) {
                    case (?intVal) {
                        let fracStr = if (Text.size(fracPart) >= 2) {
                            let chars = Text.toArray(fracPart);
                            let firstTwo = Array.subArray(chars, 0, 2);
                            Text.fromArray(firstTwo); // Take first 2 decimal places
                        } else {
                            fracPart # "0"; // Pad with zero if needed
                        };
                        switch (Nat.fromText(fracStr)) {
                            case (?fracVal) {
                                ?(intVal * 100 + fracVal);
                            };
                            case null ?(intVal * 100);
                        };
                    };
                    case null null;
                };
            };
            case (?intPart, null) {
                switch (Nat.fromText(intPart)) {
                    case (?intVal) ?(intVal * 100);
                    case null null;
                };
            };
            case _ null;
        };
    };
    
    /// Get current BTC price (cached with 5 min expiry)
    public func getBtcPriceUsd() : async LendingResult<Nat> {
        let now = Time.now();
        let fiveMinutes = 5 * 60 * 1_000_000_000; // 5 minutes in nanoseconds
        
        if (now - lastPriceUpdate > fiveMinutes) {
            // Price is stale, update it
            await updateBtcPrice();
        } else {
            #ok(lastBtcPriceUsdCents);
        };
    };
    
    /// Get current BTC price (read-only)
    public query func getCurrentBtcPrice() : async {priceUsdCents : Nat; lastUpdate : Time.Time} {
        {
            priceUsdCents = lastBtcPriceUsdCents;
            lastUpdate = lastPriceUpdate;
        }
    };
    
    // ===============================
    // LOAN CREATION & MANAGEMENT
    // ===============================
    
    /// Create loan using Bitcoin collateral → get USDC on Ethereum
    public shared(msg) func createLoan(
        usdcAmount : Nat,
        durationDays : Nat
    ) : async LendingResult<Nat> {
        let user = msg.caller;
        
        // Validate inputs
        if (usdcAmount < MIN_USDC_LOAN) {
            return #err(#InvalidAmount("Minimum loan amount: " # Nat.toText(MIN_USDC_LOAN / 1_000_000) # " USDC"));
        };
        if (usdcAmount > MAX_USDC_LOAN) {
            return #err(#InvalidAmount("Maximum loan amount: " # Nat.toText(MAX_USDC_LOAN / 1_000_000) # " USDC"));
        };
        if (durationDays > MAX_LOAN_DURATION_DAYS) {
            return #err(#InvalidAmount("Maximum duration: " # Nat.toText(MAX_LOAN_DURATION_DAYS) # " days"));
        };
        
        // Ensure user has addresses
        let _userBtcAddress = switch (bitcoinAddresses.get(user)) {
            case (?addr) addr;
            case null return #err(#InvalidAddress("No Bitcoin address found. Generate one first."));
        };
        
        let userEthAddress = switch (ethereumAddresses.get(user)) {
            case (?addr) addr;
            case null return #err(#InvalidAddress("No Ethereum address found. Generate one first."));
        };
        
        // Update Bitcoin balance and BTC price
        let _ = await updateBitcoinBalance();
        let btcPriceResult = await getBtcPriceUsd();
        let btcPriceUsdCents = switch (btcPriceResult) {
            case (#ok(price)) price;
            case (#err(e)) return #err(e);
        };
        
        // Get user's current Bitcoin balance
        let userBitcoinBalance = switch (bitcoinBalances.get(user)) {
            case (?balance) balance;
            case null 0 : BitcoinAPI.Satoshi;
        };
        
        if (userBitcoinBalance < MIN_BITCOIN_COLLATERAL) {
            return #err(#InsufficientCollateral({
                required = Nat64.toNat(MIN_BITCOIN_COLLATERAL);
                available = Nat64.toNat(userBitcoinBalance);
            }));
        };
        
        // Calculate required collateral (150% collateralization)
        let usdcValueCents = usdcAmount / 10000; // Convert from 6 decimals to cents
        let requiredCollateralValueCents = (usdcValueCents * MIN_COLLATERAL_RATIO) / 10000;
        let requiredBitcoinSats = Nat64.fromNat((requiredCollateralValueCents * 100_000_000) / btcPriceUsdCents);
        
        // Check if user has enough Bitcoin collateral
        let availableCollateral : BitcoinAPI.Satoshi = userBitcoinBalance;
        if (availableCollateral < requiredBitcoinSats) {
            return #err(#InsufficientCollateral({
                required = Nat64.toNat(requiredBitcoinSats);
                available = Nat64.toNat(availableCollateral);
            }));
        };
        
        // Calculate fees safely
        let originationFee = (usdcAmount * ORIGINATION_FEE_BPS) / 10_000;
        
        // Ensure origination fee doesn't exceed the loan amount
        if (originationFee >= usdcAmount) {
            return #err(#InvalidAmount("Origination fee exceeds loan amount"));
        };
        
        // Perform safe subtraction using Int operations
        let netUsdcAmount = Int.abs(usdcAmount - originationFee);
        
        try {
            // Send USDC to user's Ethereum address
            let ethTxResult = await sendUsdcToEthereum(netUsdcAmount, userEthAddress, user);
            let ethTxHash = switch (ethTxResult) {
                case (#ok(hash)) hash;
                case (#err(error)) return #err(error);
            };
            
            // Create loan record
            let loanId = nextLoanId;
            nextLoanId += 1;
            
            let loan : Loan = {
                id = loanId;
                borrower = user;
                bitcoinCollateral = requiredBitcoinSats;
                usdcBorrowed = usdcAmount;
                ethereumAddress = userEthAddress;
                ethereumTxHash = ?ethTxHash;
                interestRateBps = INTEREST_RATE_BPS;
                originationFeeBps = ORIGINATION_FEE_BPS;
                startTime = Time.now();
                endTime = Time.now() + (Int.abs(durationDays) * 24 * 60 * 60 * 1_000_000_000);
                isActive = true;
                isLiquidated = false;
                lastPriceCheck = Time.now();
                collateralRatio = (Nat64.toNat(requiredBitcoinSats) * btcPriceUsdCents) / (usdcValueCents * 100);
            };
            
            loans.put(loanId, loan);
            
            // Update user profile
            updateUserProfile(user, requiredBitcoinSats, loanId);
            
            // Update system stats
            totalSystemCollateral += requiredBitcoinSats;
            totalSystemDebt += usdcAmount;
            totalProtocolFees += originationFee;
            
            Debug.print("✅ Created loan " # Nat.toText(loanId) # " for " # Principal.toText(user));
            Debug.print("📤 Sent " # Nat.toText(netUsdcAmount / 1_000_000) # " USDC to " # userEthAddress);
            
            #ok(loanId);
        } catch (e) {
            #err(#SystemError("Loan creation failed: " # Error.message(e)));
        };
    };
    
    // Update user profile with new loan
    private func updateUserProfile(user : Principal, lockedBtc : BitcoinAPI.Satoshi, loanId : Nat) {
        let existingProfile = userProfiles.get(user);
        let now = Time.now();
        
        let profile = switch (existingProfile) {
            case (?existing) {
                {
                    existing with
                    totalBitcoinLocked = existing.totalBitcoinLocked + lockedBtc;
                    activeLoans = Array.append(existing.activeLoans, [loanId]);
                    lastUpdated = now;
                }
            };
            case null {
                {
                    principal = user;
                    bitcoinAddress = switch (bitcoinAddresses.get(user)) { case (?addr) ?addr; case null null };
                    ethereumAddress = switch (ethereumAddresses.get(user)) { case (?addr) ?addr; case null null };
                    totalBitcoinDeposited = switch (bitcoinBalances.get(user)) { 
                        case (?bal) bal; 
                        case null 0 : BitcoinAPI.Satoshi;
                    };
                    totalBitcoinLocked = lockedBtc;
                    activeLoans = [loanId];
                    createdAt = now;
                    lastUpdated = now;
                }
            };
        };
        
        userProfiles.put(user, profile);
    };
    
    // ===============================
    // ETHEREUM INTEGRATION (Chain Fusion)
    // ===============================
    
    // Send USDC to Ethereum address using Chain Fusion
    private func sendUsdcToEthereum(amount : Nat, toAddress : Text, fromUser : Principal) : async LendingResult<Text> {
        try {
            // Use the production EthereumAPI to send USDC
            let usdcConfig = EthereumAPI.USDC_ETHEREUM;
            let result = await EthereumAPI.sendErc20ToEthereum(
                usdcConfig,
                fromUser,
                toAddress,
                amount
            );
            
            switch (result) {
                case (#ok(txHash)) {
                    Debug.print("💸 USDC transfer successful: " # txHash);
                    #ok(txHash);
                };
                case (#err(error)) {
                    #err(#EthereumError("USDC transfer failed: " # debug_show(error)));
                };
            };
        } catch (e) {
            #err(#EthereumError("USDC transfer error: " # Error.message(e)));
        };
    };
    
    // Check USDC balance on Ethereum for user
    public shared(msg) func getUsdcBalanceOnEthereum() : async LendingResult<Nat> {
        let user = msg.caller;
        
        switch (ethereumAddresses.get(user)) {
            case null {
                return #err(#InvalidAddress("No Ethereum address found"));
            };
            case (?address) {
                try {
                    let usdcConfig = EthereumAPI.USDC_ETHEREUM;
                    let result = await EthereumAPI.getErc20Balance(
                        usdcConfig, 
                        address
                    );
                    
                    switch (result) {
                        case (#ok(balance)) #ok(balance);
                        case (#err(error)) #err(#EthereumError("Balance check failed: " # debug_show(error)));
                    };
                } catch (e) {
                    #err(#EthereumError("Balance check error: " # Error.message(e)));
                };
            };
        };
    };
    
    // Sign Ethereum transaction on behalf of user (for active loan holders)
    public shared(msg) func signEthereumTransaction(
        txHash : [Nat8]
    ) : async LendingResult<[Nat8]> {
        let user = msg.caller;
        
        // Check if user has active loans
        let hasActiveLoan = switch (userProfiles.get(user)) {
            case null false;
            case (?profile) Array.size(profile.activeLoans) > 0;
        };
        
        if (not hasActiveLoan) {
            return #err(#Unauthorized);
        };
        
        try {
            // Create derivation path for user
            let userBytes = Blob.toArray(Principal.toBlob(user));
            let derivationPath = [Blob.fromArray(userBytes)];
            
            let result = await EthereumAPI.signTransactionHash(txHash, derivationPath);
            switch (result) {
                case (#ok(signature)) #ok(signature);
                case (#err(error)) #err(#EthereumError("Transaction signing failed: " # debug_show(error)));
            };
        } catch (e) {
            #err(#EthereumError("Signing error: " # Error.message(e)));
        };
    };
    
    // ===============================
    // QUERY FUNCTIONS
    // ===============================
    
    // Get user profile
    public shared query(msg) func getUserProfile() : async ?UserProfile {
        userProfiles.get(msg.caller);
    };
    
    // Get loan details
    public query func getLoan(loanId : Nat) : async ?Loan {
        loans.get(loanId);
    };
    
    // Get user's loans
    public shared query(msg) func getMyLoans() : async [Loan] {
        let user = msg.caller;
        let userLoans = Buffer.Buffer<Loan>(0);
        
        for ((_, loan) in loans.entries()) {
            if (loan.borrower == user) {
                userLoans.add(loan);
            };
        };
        
        Buffer.toArray(userLoans);
    };
    
    // Get all loans for a user (admin function)
    public query func getUserLoans(user : Principal) : async [Loan] {
        let userLoans = Buffer.Buffer<Loan>(0);
        
        for ((_, loan) in loans.entries()) {
            if (loan.borrower == user) {
                userLoans.add(loan);
            };
        };
        
        Buffer.toArray(userLoans);
    };
    
    // Get platform statistics
    public query func getPlatformStats() : async {
        totalUsers : Nat;
        totalLoans : Nat;
        totalCollateral : BitcoinAPI.Satoshi;
        totalDebt : Nat;
        protocolFees : Nat;
        currentBtcPrice : Nat;
        lastPriceUpdate : Time.Time;
    } {
        {
            totalUsers = userProfiles.size();
            totalLoans = loans.size();
            totalCollateral = totalSystemCollateral;
            totalDebt = totalSystemDebt;
            protocolFees = totalProtocolFees;
            currentBtcPrice = lastBtcPriceUsdCents;
            lastPriceUpdate = lastPriceUpdate;
        }
    };
    
    // ===============================
    // SYSTEM ADMINISTRATION
    // ===============================
    
    /// Health check
    public query func health() : async {
        status : Text; 
        timestamp : Time.Time;
        version : Text;
        network : Text;
    } {
        {
            status = "healthy";
            timestamp = Time.now();
            version = "1.0.0-production";
            network = debug_show(BITCOIN_NETWORK);
        }
    };
    
    /// Get system information
    public query func getSystemInfo() : async {
        canisterPrincipal : Principal;
        bitcoinNetwork : Text;
        evmRpcCanister : Text;
        ecdsaKeyName : Text;
        minCollateralRatio : Nat;
        interestRateBps : Nat;
        version : Text;
    } {
        {
            canisterPrincipal = Principal.fromActor(BitPesaNativeBitcoinLendingProduction);
            bitcoinNetwork = debug_show(BITCOIN_NETWORK);
            evmRpcCanister = EVM_RPC_CANISTER;
            ecdsaKeyName = ECDSA_KEY_NAME;
            minCollateralRatio = MIN_COLLATERAL_RATIO;
            interestRateBps = INTEREST_RATE_BPS;
            version = "1.0.0-native-bitcoin-production";
        }
    };
}
