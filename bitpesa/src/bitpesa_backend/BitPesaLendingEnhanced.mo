import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
// import Timer "mo:base/Timer";
import Management "./Management";
import Hash "mo:base/Hash";
import Blob "mo:base/Blob";
import PriceParser "./PriceParser";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import Types "./types";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import BitcoinAPI "./BitcoinAPI";

// BitPesa Bitcoin Lending Platform with Native Bitcoin Integration
actor class BitPesaLending(init : Types.Config) {

    stable var ownPrincipal : Principal = init.own_principal;

    public shared func update_own_principal(p : Principal) : async () {
        ownPrincipal := p;
    };

    public type Config = Types.Config;

    public type AppError = {
        #InsufficientBalance;
        #InsufficientCollateral;
        #LoanNotFound;
        #LoanNotActive;
        #Unauthorized;
        #CollateralLocked;
        #LoanExceedsCollateralRatio;
        #InsufficientPlatformLiquidity;
        #RepaymentTooLow;
        #InvalidLoanDuration;
        #PriceOracleFailed : Text;
        #TransferFailed : Text;
        #BitcoinError : Text;
        #AddressGenerationFailed : Text;
    };

    public type LoanId = Nat;

    stable var userBitcoinLockedEntries : [(Principal, Nat)] = [];
    var userBitcoinLocked = HashMap.HashMap<Principal, Nat>(10, Principal.equal, Principal.hash);

    public type Loan = {
        id : LoanId;
        borrower : Principal;
        collateralAmount : Nat;
        loanAmount : Nat;
        startTimestamp : Time.Time;
        endTimestamp : Time.Time;
        interestRateBps : Nat;
        active : Bool;
        liquidated : Bool;
        collateralType : CollateralType;
    };

    public type CollateralType = {
        #ckBTC;
        #NativeBTC;
    };

    public type BitcoinDepositRequest = {
        amount : BitcoinAPI.Satoshi;
        user_derivation_path : Text;
    };

    let owner : Principal = init.owner;
    // let ckbtcCanister : Types.ICRC1 = actor (Principal.toText(init.ckbtc_canister));
    let stablecoinCanister : Types.ICRC1 = actor (Principal.toText(init.stablecoin_canister));

    // Configuration
    stable var requiredCollateralRatio : Nat = 150;
    // stable var liquidationThreshold : Nat = 125;
    stable var borrowFeeBps : Nat = 50;
    stable var interestRatePerYearBps : Nat = 500;
    stable var maxLoanDurationDays : Nat = 365;

    // Bitcoin-specific configuration
    stable var bitcoin_network : BitcoinAPI.BitcoinNetwork = #regtest;
    // stable var bitcoin_enabled : Bool = true;
    stable var min_bitcoin_deposit : BitcoinAPI.Satoshi = 100_000;

    // State variables
    stable var loansEntries : [(LoanId, Loan)] = [];
    var loans = HashMap.HashMap<LoanId, Loan>(10, Nat.equal, Hash.hash);
    stable var nextLoanId : LoanId = 0;

    stable var userCollateralEntries : [(Principal, Nat)] = [];
    var userCollateral = HashMap.HashMap<Principal, Nat>(10, Principal.equal, Principal.hash);

    // Bitcoin-specific state
    stable var userBitcoinDepositsEntries : [(Principal, BitcoinAPI.Satoshi)] = [];
    var userBitcoinDeposits = HashMap.HashMap<Principal, BitcoinAPI.Satoshi>(10, Principal.equal, Principal.hash);

    stable var userBitcoinAddressesEntries : [(Principal, Text)] = [];
    var userBitcoinAddresses = HashMap.HashMap<Principal, Text>(10, Principal.equal, Principal.hash);

    stable var totalCollateralLocked : Nat = 0;
    stable var totalLoansOutstanding : Nat = 0;
    stable var protocolFeeBalance : Nat = 0;
    stable var totalBitcoinCollateral : BitcoinAPI.Satoshi = 0;

    // var liquidationTimer : ?Timer.TimerId = null;

    // Initialize HashMap from stable storage
    private func post_upgrade_init() {
        loans := HashMap.fromIter(loansEntries.vals(), loansEntries.size(), Nat.equal, Hash.hash);
        userCollateral := HashMap.fromIter(userCollateralEntries.vals(), userCollateralEntries.size(), Principal.equal, Principal.hash);
        userBitcoinDeposits := HashMap.fromIter(userBitcoinDepositsEntries.vals(), userBitcoinDepositsEntries.size(), Principal.equal, Principal.hash);
        userBitcoinAddresses := HashMap.fromIter(userBitcoinAddressesEntries.vals(), userBitcoinAddressesEntries.size(), Principal.equal, Principal.hash);
        userBitcoinLocked := HashMap.fromIter(userBitcoinLockedEntries.vals(), userBitcoinLockedEntries.size(), Principal.equal, Principal.hash);
    };

    system func preupgrade() {
        loansEntries := Iter.toArray(loans.entries());
        userCollateralEntries := Iter.toArray(userCollateral.entries());
        userBitcoinDepositsEntries := Iter.toArray(userBitcoinDeposits.entries());
        userBitcoinAddressesEntries := Iter.toArray(userBitcoinAddresses.entries());
        userBitcoinLockedEntries := Iter.toArray(userBitcoinLocked.entries());
    };

    system func postupgrade() {
        post_upgrade_init();
    };

    post_upgrade_init();

    // Transform function for HTTP requests
    public shared query func transform(args : Management.TransformArgs) : async Management.HttpResponse {
        let response = args.response;
        var sanitized_headers : [Management.HttpHeader] = [];
        for (h in response.headers.vals()) {
            if (Text.toLowercase(h.name) == "date") {
                sanitized_headers := Array.append<Management.HttpHeader>([h], sanitized_headers);
            };
        };
        { response with headers = sanitized_headers };
    };

    // =================================================================================================
    // BITCOIN INTEGRATION FUNCTIONS
    // =================================================================================================

    // Generate a unique Bitcoin address for a user
    public shared (msg) func generateUserBitcoinAddress() : async Result.Result<Text, AppError> {
        let user = msg.caller;
        // Check if user already has an address
        switch (userBitcoinAddresses.get(user)) {
            case (?existing_address) {
                if (Text.size(existing_address) == 0) {
                    Debug.print("User has empty Bitcoin address in map, will try to regenerate");
                } else {
                    return #ok(existing_address);
                };
            };
            case null {};
        };
        // Generate new address using user's principal as derivation path
        let derivationResult = BitcoinAPI.create_derivation_path(Principal.toText(user));
        switch (derivationResult) {
            case (#err(error)) {
                Debug.print("Error creating derivation path: " # BitcoinAPI.error_to_text(error));
                return #err(#AddressGenerationFailed(BitcoinAPI.error_to_text(error)));
            };
            case (#ok(derivation_path)) {
                let key_id = BitcoinAPI.get_key_id(bitcoin_network);
                let pubkeyResult = await BitcoinAPI.get_ecdsa_public_key(derivation_path, key_id);
                switch (pubkeyResult) {
                    case (#err(error)) {
                        Debug.print("Error getting ECDSA public key: " # BitcoinAPI.error_to_text(error));
                        return #err(#AddressGenerationFailed(BitcoinAPI.error_to_text(error)));
                    };
                    case (#ok(response)) {
                        let addressResult = BitcoinAPI.public_key_to_p2pkh_address(response.public_key, bitcoin_network);
                        switch (addressResult) {
                            case (#err(error)) {
                                Debug.print("Error converting public key to address: " # BitcoinAPI.error_to_text(error));
                                return #err(#AddressGenerationFailed(BitcoinAPI.error_to_text(error)));
                            };
                            case (#ok(address)) {
                                Debug.print("Generated new Bitcoin address: " # address);
                                userBitcoinAddresses.put(user, address);
                                return #ok(address);
                            };
                        };
                    };
                };
            };
        };
    };

    // Get user's Bitcoin address
    public shared query (msg) func getUserBitcoinAddress() : async ?Text {
        userBitcoinAddresses.get(msg.caller);
    };

    // Check Bitcoin balance for a user's address (by principal)
    public shared (msg) func getUserBitcoinBalance() : async Result.Result<BitcoinAPI.Satoshi, AppError> {
        await getBitcoinBalanceForUser(msg.caller);
    };

    // Private helper to get Bitcoin balance for any user principal
    private func getBitcoinBalanceForUser(user : Principal) : async Result.Result<BitcoinAPI.Satoshi, AppError> {
        Debug.print("Checking Bitcoin balance for user: " # Principal.toText(user));
        switch (userBitcoinAddresses.get(user)) {
            case (?address) {
                if (Text.size(address) == 0) {
                    Debug.print("User has empty Bitcoin address");
                    return #err(#AddressGenerationFailed("User has empty Bitcoin address"));
                };
                let request : BitcoinAPI.GetBalanceRequest = {
                    address = address;
                    network = bitcoin_network;
                    min_confirmations = ?1;
                };
                let balanceResult = await BitcoinAPI.get_balance(request);
                switch (balanceResult) {
                    case (#ok(balance)) {
                        Debug.print("Fetched Bitcoin balance: " # Nat64.toText(balance));
                        #ok(balance);
                    };
                    case (#err(error)) {
                        Debug.print("BitcoinAPI.get_balance error: " # BitcoinAPI.error_to_text(error));
                        #err(#BitcoinError(BitcoinAPI.error_to_text(error)));
                    };
                };
            };
            case null {
                Debug.print("No Bitcoin address found for user");
                #err(#AddressGenerationFailed("No Bitcoin address found for user"));
            };
        };
    };

    // Deposit Bitcoin as collateral (user must send BTC to their address first)
    public shared (msg) func depositBitcoinCollateral() : async Result.Result<BitcoinAPI.Satoshi, AppError> {
        let user = msg.caller;
        Debug.print("Depositing Bitcoin collateral for user: " # Principal.toText(user));
        switch (userBitcoinAddresses.get(user)) {
            case (?address) {
                // Defensive: check address is not empty
                if (Text.size(address) == 0) {
                    Debug.print("User has empty Bitcoin address");
                    return #err(#AddressGenerationFailed("User has empty Bitcoin address"));
                };
                // Get user's current Bitcoin balance (by principal, not msg.caller)
                let balanceResult = await getBitcoinBalanceForUser(user);
                switch (balanceResult) {
                    case (#err(error)) {
                        Debug.print("Error getting user Bitcoin balance: " # debug_show (error));
                        return #err(error);
                    };
                    case (#ok(current_balance)) {
                        Debug.print("User current Bitcoin balance: " # Nat64.toText(current_balance));
                        // Get previously recorded deposit amount
                        let previous_deposit : BitcoinAPI.Satoshi = switch (userBitcoinDeposits.get(user)) {
                            case (?amount) amount;
                            case null 0;
                        };
                        Debug.print("User previous deposit: " # Nat64.toText(previous_deposit));
                        // Calculate new deposit amount
                        if (current_balance > previous_deposit) {
                            let new_deposit = current_balance - previous_deposit;
                            Debug.print("New deposit amount: " # Nat64.toText(new_deposit));
                            if (new_deposit < min_bitcoin_deposit) {
                                Debug.print("New deposit below minimum: " # Nat64.toText(min_bitcoin_deposit));
                                return #err(#InsufficientBalance);
                            };
                            // Update user's deposit record
                            userBitcoinDeposits.put(user, current_balance);
                            totalBitcoinCollateral := totalBitcoinCollateral + new_deposit;
                            #ok(new_deposit);
                        } else {
                            Debug.print("No new deposit detected or insufficient balance");
                            #err(#InsufficientBalance);
                        };
                    };
                };
            };
            case null {
                Debug.print("No Bitcoin address found for user");
                #err(#AddressGenerationFailed("No Bitcoin address found for user"));
            };
        };
    };

    // Get user's Bitcoin collateral amount
    public shared query (msg) func getUserBitcoinCollateral() : async BitcoinAPI.Satoshi {
        switch (userBitcoinDeposits.get(msg.caller)) {
            case (?amount) amount;
            case null 0;
        };
    };

    // =================================================================================================
    // PRICE ORACLE FUNCTIONS
    // =================================================================================================

    public func getBtcUsdPrice() : async Result.Result<Nat, AppError> {
        let url = "https://api.coinbase.com/v2/prices/BTC-USD/spot";

        let request : Management.HttpRequest = {
            url = url;
            max_response_bytes = ?2048;
            headers = [];
            method = #get;
            body = null;
            transform = ?{
                function = transform;
                context = Blob.fromArray([]);
            };
        };

        try {
            let response = await Management.http_request(request, 100_000_000);
            switch (response) {
                case (#Ok(httpResponse)) {
                    if (httpResponse.status == 200) {
                        let body = Text.decodeUtf8(Blob.fromArray(httpResponse.body));
                        switch (body) {
                            case (?bodyText) {
                                switch (PriceParser.extractBtcUsdPrice(bodyText)) {
                                    case (?price) #ok(price);
                                    case null #err(#PriceOracleFailed("Failed to parse price"));
                                };
                            };
                            case null #err(#PriceOracleFailed("Failed to decode response"));
                        };
                    } else {
                        #err(#PriceOracleFailed("HTTP request failed"));
                    };
                };
                case (#Err(code, message)) {
                    #err(#PriceOracleFailed("HTTP request error: " # code # " - " # message));
                };
            };
        } catch (_) {
            #err(#PriceOracleFailed("Network error"));
        };
    };

    // =================================================================================================
    // LENDING FUNCTIONS
    // =================================================================================================

    // Create a loan using Bitcoin collateral
    public shared (msg) func createBitcoinLoan(
        loanAmount : Nat,
        durationDays : Nat,
    ) : async Result.Result<LoanId, AppError> {
        let borrower = msg.caller;

        if (durationDays > maxLoanDurationDays) {
            return #err(#InvalidLoanDuration);
        };

        // Get current BTC price
        switch (await getBtcUsdPrice()) {
            case (#err(error)) return #err(error);
            case (#ok(btcPrice)) {

                let requiredCollateralValue = (loanAmount * 100) / 85;

                let requiredCollateralSats = (requiredCollateralValue * (10 ** 8)) / btcPrice;

                // Get user's available collateral
                let totalDeposited = switch (userBitcoinDeposits.get(borrower)) {
                    case (?amount) Nat64.toNat(amount);
                    case null 0;
                };
                let currentlyLocked = switch (userBitcoinLocked.get(borrower)) {
                    case (?amount) amount;
                    case null 0;
                };
                let availableCollateral = totalDeposited - currentlyLocked;

                if (availableCollateral < requiredCollateralSats) {
                    return #err(#InsufficientCollateral);
                };

                // Apply borrow fee
                let borrowFee = (loanAmount * borrowFeeBps) / 10000;
                let netLoanAmount = loanAmount - borrowFee;

                // Create loan
                let loan : Loan = {
                    id = nextLoanId;
                    borrower = borrower;
                    collateralAmount = requiredCollateralSats; // Lock calculated collateral
                    loanAmount = loanAmount;
                    startTimestamp = Time.now();
                    endTimestamp = Time.now() + (durationDays * 24 * 60 * 60 * 1_000_000_000);
                    interestRateBps = interestRatePerYearBps;
                    active = true;
                    liquidated = false;
                    collateralType = #NativeBTC;
                };

                loans.put(nextLoanId, loan);
                nextLoanId += 1;

                // Update locked collateral
                userBitcoinLocked.put(borrower, currentlyLocked + requiredCollateralSats);

                // Update balances
                totalLoansOutstanding += loanAmount;
                protocolFeeBalance += borrowFee;

                // Transfer stablecoin to borrower
                let transfer_res = await stablecoinCanister.icrc1_transfer({
                    to = { owner = borrower; subaccount = null };
                    amount = netLoanAmount;
                    fee = null;
                    memo = null;
                    created_at_time = null;
                });

                switch (transfer_res) {
                    case (#Ok(_)) #ok(loan.id);
                    case (#Err(_)) #err(#TransferFailed("Stablecoin transfer failed"));
                };
            };
        };
    };

    // Repay a loan and release collateral
    public shared (msg) func repayLoan(loanId : LoanId) : async Result.Result<Null, AppError> {
        let borrower = msg.caller;

        switch (loans.get(loanId)) {
            case (?loan) {
                if (loan.borrower != borrower) {
                    return #err(#Unauthorized);
                };

                if (not loan.active) {
                    return #err(#LoanNotActive);
                };

                let totalDue = calculateTotalDue(loan);

                // Transfer stablecoin from borrower
                let transfer_res = await stablecoinCanister.icrc2_transfer_from({
                    spender_subaccount = null;
                    from = { owner = borrower; subaccount = null };
                    to = { owner = ownPrincipal; subaccount = null };
                    amount = totalDue;
                    fee = null;
                    memo = null;
                    created_at_time = null;
                });

                switch (transfer_res) {
                    case (#Ok(_)) {
                        // Mark loan as repaid
                        let updatedLoan = { loan with active = false };
                        loans.put(loanId, updatedLoan);

                        // Release collateral
                        let currentlyLocked = switch (userBitcoinLocked.get(borrower)) {
                            case (?amount) amount;
                            case null 0;
                        };
                        userBitcoinLocked.put(borrower, currentlyLocked - loan.collateralAmount);

                        totalLoansOutstanding -= loan.loanAmount;

                        #ok(null);
                    };
                    case (#Err(_)) #err(#TransferFailed("Repayment transfer failed"));
                };
            };
            case null #err(#LoanNotFound);
        };
    };

    // =================================================================================================
    // QUERY FUNCTIONS
    // =================================================================================================

    public query func getLoan(loanId : LoanId) : async ?Loan {
        loans.get(loanId);
    };


    // Withdraw Bitcoin collateral to a specified recipient address (production-ready, multi-step, with ECDSA signing)
    public shared (msg) func withdrawBitcoinCollateral(amount: Nat, recipientAddress: Text) : async Result.Result<Text, AppError> {
        let user = msg.caller;
        // Get available collateral (deposited - locked)
        let totalDeposited = switch (userBitcoinDeposits.get(user)) {
            case (?amount) Nat64.toNat(amount);
            case null 0;
        };
        let currentlyLocked = switch (userBitcoinLocked.get(user)) {
            case (?amount) amount;
            case null 0;
        };
        let available = totalDeposited - currentlyLocked;
        if (available < amount) {
            return #err(#InsufficientBalance);
        };
        // Get user's Bitcoin address (change address)
        let userAddress = switch (userBitcoinAddresses.get(user)) {
            case (?addr) addr;
            case null return #err(#AddressGenerationFailed("No address found"));
        };
        // 1. Get UTXOs for the user's address
        let utxosResult = await BitcoinAPI.get_utxos({ address = userAddress; network = bitcoin_network; filter = null });
        let utxos = switch (utxosResult) {
            case (#ok(resp)) resp.utxos;
            case (#err(error)) return #err(#BitcoinError("Failed to fetch UTXOs: " # BitcoinAPI.error_to_text(error)));
        };
        // 2. Get recommended fee rate
        let feeRateResult = await BitcoinAPI.get_recommended_fee_rate(bitcoin_network, #medium);
        let feeRate = switch (feeRateResult) {
            case (#ok(rate)) rate;
            case (#err(error)) return #err(#BitcoinError("Failed to get fee rate: " # BitcoinAPI.error_to_text(error)));
        };
        // 3. Build unsigned transaction (get tx + sighashes)
        // Get user's ECDSA public key for each input (assume all inputs are from the same user address)

        
        let key_id = BitcoinAPI.get_key_id(bitcoin_network);
        // txData.sighashes : [ [Nat8] ]
        var signatures : [[Nat8]] = [];

        var pubkeys : [[Nat8]] = [];
        // For each input, sign and collect pubkey

        let derivationResult = BitcoinAPI.create_derivation_path(Principal.toText(user));
        let derivation_path = switch (derivationResult) {
            case (#ok(path)) path;
            case (#err(error)) return #err(#BitcoinError("Failed to create derivation path: " # BitcoinAPI.error_to_text(error)));
        };
        let pubkeyResult = await BitcoinAPI.get_ecdsa_public_key(derivation_path, key_id);
        let pubkey = switch (pubkeyResult) {
            case (#ok(resp)) resp.public_key;
            case (#err(error)) return #err(#BitcoinError("Failed to get ECDSA public key: " # BitcoinAPI.error_to_text(error)));
        };
        let txBuildResult = await BitcoinAPI.create_transaction(
            utxos,
            recipientAddress,
            Nat64.fromNat(amount),
            feeRate,
            userAddress,
            bitcoin_network,
            pubkey
        );
        let txData = switch (txBuildResult) {
            case (#ok(data)) data;
            case (#err(error)) return #err(#BitcoinError("Failed to build transaction: " # BitcoinAPI.error_to_text(error)));
        };

        for (sighash in txData.sighashes.vals()) {
            let signResult = await BitcoinAPI.sign_with_ecdsa(sighash, derivation_path, key_id);
            let sig = switch (signResult) {
                case (#ok(resp)) resp.signature;
                case (#err(error)) return #err(#BitcoinError("Failed to sign transaction: " # BitcoinAPI.error_to_text(error)));
            };
            signatures := Array.append<[Nat8]>(signatures, [sig]);
            pubkeys := Array.append<[Nat8]>(pubkeys, [pubkey]);
        };
        // 5. Assemble signed transaction
        let signedTxResult = BitcoinAPI.assemble_signed_transaction(txData.transaction, signatures, pubkeys);
        let signedTx = switch (signedTxResult) {
            case (#ok(tx_bytes)) tx_bytes;
            case (#err(error)) return #err(#BitcoinError("Failed to assemble signed transaction: " # BitcoinAPI.error_to_text(error)));
        };
        // 6. Broadcast transaction
        let sendResult = await BitcoinAPI.send_transaction({ transaction = signedTx; network = bitcoin_network });
        switch (sendResult) {
            case (#ok(_)) {
                // Update deposited amount
                let newDeposited = Nat64.sub(Nat64.fromNat(totalDeposited), Nat64.fromNat(amount));
                userBitcoinDeposits.put(user, newDeposited);
                totalBitcoinCollateral := Nat64.sub(totalBitcoinCollateral, Nat64.fromNat(amount));
                #ok("Withdrawal broadcasted successfully.");
            };
            case (#err(error)) {
                #err(#BitcoinError("Withdrawal failed: " # BitcoinAPI.error_to_text(error)))
            };
        };
    };

    // Get available collateral
    public shared query (msg) func getAvailableCollateral() : async Nat {
        let user = msg.caller;
        let totalDeposited = switch (userBitcoinDeposits.get(user)) {
            case (?amount) Nat64.toNat(amount);
            case null 0;
        };
        let currentlyLocked = switch (userBitcoinLocked.get(user)) {
            case (?amount) amount;
            case null 0;
        };
        totalDeposited - currentlyLocked
    };

    public query func getUserLoans(user : Principal) : async [Loan] {
        let userLoans = Buffer.Buffer<Loan>(0);
        for ((_, loan) in loans.entries()) {
            if (loan.borrower == user) {
                userLoans.add(loan);
            };
        };
        Buffer.toArray(userLoans);
    };

    public query func getPlatformStats() : async {
        totalLoans : Nat;
        totalCollateral : Nat;
        totalBitcoinCollateral : BitcoinAPI.Satoshi;
        totalOutstanding : Nat;
        protocolFees : Nat;
    } {
        {
            totalLoans = loans.size();
            totalCollateral = totalCollateralLocked;
            totalBitcoinCollateral = totalBitcoinCollateral;
            totalOutstanding = totalLoansOutstanding;
            protocolFees = protocolFeeBalance;
        };
    };

    // =================================================================================================
    // PRIVATE HELPER FUNCTIONS
    // =================================================================================================

    private func calculateInterest(loan : Loan) : Nat {
        let now = Time.now();
        let loanEnd = if (now > loan.endTimestamp) { now } else {
            loan.endTimestamp;
        };
        let durationNs = loanEnd - loan.startTimestamp;
        let durationYears = Nat64.toNat(Nat64.fromIntWrap(durationNs) / Nat64.fromNat(365 * 24 * 60 * 60 * 1_000_000_000));
        (loan.loanAmount * loan.interestRateBps * durationYears) / 10000;
    };

    private func calculateTotalDue(loan : Loan) : Nat {
        let interest = calculateInterest(loan);
        loan.loanAmount + interest;
    };

    private func isOwner(caller : Principal) {
        if (caller != owner) {
            Debug.trap("Unauthorized: only the owner can perform this action");
        };
    };

    // =================================================================================================
    // ADMIN FUNCTIONS
    // =================================================================================================

    public shared (msg) func updateCollateralRatio(newRatio : Nat) {
        isOwner(msg.caller);
        requiredCollateralRatio := newRatio;
    };

    public shared (msg) func setBitcoinNetwork(network : BitcoinAPI.BitcoinNetwork) {
        isOwner(msg.caller);
        bitcoin_network := network;
    };

    public shared (msg) func withdrawFees(amount : Nat) : async Result.Result<Null, AppError> {
        isOwner(msg.caller);
        if (amount > protocolFeeBalance) {
            return #err(#InsufficientBalance);
        };

        let transfer_res = await stablecoinCanister.icrc1_transfer({
            to = { owner = owner; subaccount = null };
            amount = amount;
            fee = null;
            memo = null;
            created_at_time = null;
        });

        switch (transfer_res) {
            case (#Ok(_)) {
                protocolFeeBalance -= amount;
                #ok(null);
            };
            case (#Err(_)) #err(#TransferFailed("Fee withdrawal failed"));
        };
    };
};
