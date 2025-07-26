import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Timer "mo:base/Timer";
import Management "./Management";
import Hash "mo:base/Hash";
import Blob "mo:base/Blob";
import PriceParser "./PriceParser";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import Types "./types";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import BitcoinAPI "./BitcoinAPI";

/**
 * @title BitPesa Bitcoin Lending Canister (Enhanced with Native Bitcoin Integration)
 * @dev A DeFi platform on ICP that allows users to:
 *      - Deposit native Bitcoin as collateral (using threshold ECDSA)
 *      - Take loans in ICRC-1 stablecoin
 *      - Direct Bitcoin custody without bridges
 *      - Automated liquidation using Bitcoin network data
 */
// Configuration provided on canister creation

actor class BitPesaLending(init : Types.Config) {

    stable var ownPrincipal : Principal = init.own_principal;  // Store in stable variable

    public shared func update_own_principal(p : Principal) : async () {
        ownPrincipal := p;
    };

    // Re-export the Config type for external use
    public type Config = Types.Config;

    public type AppError = {
        #Unauthorized;
        #InvalidAmount;
        #InsufficientBalance;
        #InsufficientCollateral;
        #LoanNotFound;
        #LoanNotActive;
        #LoanIsLiquidated;
        #CollateralLocked;
        #LoanExceedsCollateralRatio;
        #InsufficientPlatformLiquidity;
        #RepaymentTooLow;
        #InvalidLoanDuration;
        #PriceOracleFailed : Text;
        #TransferFailed : Text;
    };

    public type LoanId = Nat;

    public type Loan = {
        id : LoanId;
        borrower : Principal;
        collateralAmount : Nat; // in ckBTC satoshis (10^8)
        loanAmount : Nat; // in stablecoin units (e.g., 10^6 for USDC)
        startTimestamp : Time.Time;
        endTimestamp : Time.Time;
        interestRateBps : Nat; // Annual interest rate in basis points (1% = 100)
        active : Bool;
        liquidated : Bool;
    };

    let owner : Principal = init.owner;
    let ckbtcCanister : Types.ICRC1 = actor (Principal.toText(init.ckbtc_canister));
    let stablecoinCanister : Types.ICRC1 = actor (Principal.toText(init.stablecoin_canister));

    stable var requiredCollateralRatio : Nat = 150; // 150%
    stable var liquidationThreshold : Nat = 125; // 125%
    stable var borrowFeeBps : Nat = 50; // 0.5% fee on borrowed amount (50 bps)
    stable var interestRatePerYearBps : Nat = 500; // 5% APR (500 bps)
    stable var maxLoanDurationDays : Nat = 365; // Maximum loan duration of 1 year

    stable var loansEntries : [(LoanId, Loan)] = [];
    var loans = HashMap.HashMap<LoanId, Loan>(10, Nat.equal, Hash.hash);
    stable var nextLoanId : LoanId = 0;

    stable var userCollateralEntries : [(Principal, Nat)] = [];
    var userCollateral = HashMap.HashMap<Principal, Nat>(10, Principal.equal, Principal.hash);

    stable var totalCollateralLocked : Nat = 0;
    stable var totalLoansOutstanding : Nat = 0;
    stable var protocolFeeBalance : Nat = 0; // In stablecoin units

    var liquidationTimer : ?Timer.TimerId = null;

    // Bitcoin-specific state variables
    stable var bitcoin_network : BitcoinAPI.BitcoinNetwork = #testnet;
    stable var bitcoin_enabled : Bool = true;
    stable var min_bitcoin_deposit : BitcoinAPI.Satoshi = 100_000; // 0.001 BTC minimum
    
    // User Bitcoin deposits tracking
    stable var userBitcoinDepositsEntries : [(Principal, BitcoinAPI.Satoshi)] = [];
    var userBitcoinDeposits = HashMap.HashMap<Principal, BitcoinAPI.Satoshi>(10, Principal.equal, Principal.hash);
    
    // Bitcoin address management for users
    stable var userBitcoinAddressesEntries : [(Principal, Text)] = [];
    var userBitcoinAddresses = HashMap.HashMap<Principal, Text>(10, Principal.equal, Principal.hash);
    
    stable var totalBitcoinCollateral : BitcoinAPI.Satoshi = 0;

    private func post_upgrade_init() {
        let interval = 5 * 60 * 1_000_000_000; // 5 minutes in nanoseconds
    };

    // Initialize HashMap from stable storage during upgrades
    system func preupgrade() {
        loansEntries := Iter.toArray(loans.entries());
        userCollateralEntries := Iter.toArray(userCollateral.entries());
    };

    system func postupgrade() {
        loans := HashMap.fromIter<LoanId, Loan>(loansEntries.vals(), 10, Nat.equal, Hash.hash);
        userCollateral := HashMap.fromIter<Principal, Nat>(userCollateralEntries.vals(), 10, Principal.equal, Principal.hash);
        post_upgrade_init();
    };

    post_upgrade_init();

    let BTC_USD_PRICE_API = "https://api.coinbase.com/v2/prices/BTC-USD/spot";

    post_upgrade_init();

    let PRICE_DECIMALS = 2;

    // This function will be called by the IC to sanitize the HTTP response.
    // This is a CRITICAL step for security and determinism.
    public shared query func transform(args : Management.TransformArgs) : async Management.HttpResponse {
        let raw = args.response;
        var sanitized_headers : [Management.HttpHeader] = [];
        for (h in raw.headers.vals()) {
            if (Text.toLowercase(h.name) == "date") {
                sanitized_headers := Array.append<Management.HttpHeader>([h], sanitized_headers);
            };
        };
        { raw with headers = sanitized_headers };
    };

    /**
     * @notice Fetches the latest BTC/USD price.
     * @dev Uses HTTPS Outcalls. Returns price as an integer, scaled by 10^PRICE_DECIMALS (e.g., 65000.12 -> 6500012)
     * @return Result containing the price or an error.
     */
    public func getBtcUsdPrice() : async Result.Result<Nat, AppError> {
        // Cost of this call is ~0.1B cycles, must be covered by the canister balance.
        let cycles_cost : Nat64 = 100_000_000;

        let res = await Management.http_request(
            {
                url = BTC_USD_PRICE_API;
                max_response_bytes = ?2048;
                method = #get;
                headers = [];
                body = null;
                transform = ?{
                    function = transform;
                    context = Blob.fromArray([]);
                };
            },
            cycles_cost,
        );

        switch (res) {
            case (#Ok(response)) {
                if (response.status != 200) {
                    let err_msg = "HTTP Error: " # Nat.toText(response.status);
                    return #err(#PriceOracleFailed(err_msg));
                };

                let body = switch (Text.decodeUtf8(Blob.fromArray(response.body))) {
                    case (null) {
                        return #err(#PriceOracleFailed("Could not decode response body as UTF-8"));
                    };
                    case (?decoded) { decoded };
                };

                // Parse the response with our specialized parser
                switch (PriceParser.extractBtcUsdPrice(body)) {
                    case (?price) {
                        return #ok(price);
                    };
                    case (null) {
                        return #err(#PriceOracleFailed("Failed to parse BTC/USD price from API response"));
                    };
                };
            };
            case (#Err(code, msg)) {
                return #err(#PriceOracleFailed("Request failed: " # msg));
            };
        };
    };

    /**
     * @notice Deposits ckBTC as collateral.
     * @dev User must first `approve` this canister to spend their ckBTC.
     * @param amount The amount of ckBTC satoshis to deposit.
     * @return A Result indicating success or an AppError.
     */
    public shared (msg) func deposit(amount : Nat) : async Result.Result<Null, AppError> {
        if (amount == 0) { return #err(#InvalidAmount) };

        let transfer_res = await ckbtcCanister.icrc2_transfer_from({
            spender_subaccount = null;
            from = { owner = msg.caller; subaccount = null };
            to = { owner = ownPrincipal; subaccount = null };
            amount = amount;
            fee = null;
            memo = null;
            created_at_time = null;
        });

        switch (transfer_res) {
            case (#Ok(_)) {
                let current_balance = switch (userCollateral.get(msg.caller)) {
                    case (null) { 0 };
                    case (?val) { val };
                };
                userCollateral.put(msg.caller, current_balance + amount);
                totalCollateralLocked += amount;
                return #ok(null);
            };
            case (#Err(err)) {
                return #err(#TransferFailed("ckBTC deposit failed. Ensure you have approved this canister."));
            };
        };
    };

    /**
     * @notice Withdraws unused ckBTC collateral.
     * @param amount The amount of ckBTC satoshis to withdraw.
     * @return A Result indicating success or an AppError.
     */
    public shared (msg) func withdraw(amount : Nat) : async Result.Result<Null, AppError> {
        if (amount == 0) { return #err(#InvalidAmount) };

        let caller = msg.caller;
        let available_collateral = getAvailableCollateral(caller);

        if (amount > available_collateral) {
            return #err(#InsufficientCollateral);
        };

        let transfer_res = await ckbtcCanister.icrc1_transfer({
            to = { owner = caller; subaccount = null };
            amount = amount;
            fee = null;
            memo = null;
            created_at_time = null;
        });

        switch (transfer_res) {
            case (#Ok(_)) {
                let current_balance = switch (userCollateral.get(caller)) {
                    case (null) { 0 };
                    case (?val) { val };
                };
                userCollateral.put(caller, current_balance - amount);
                totalCollateralLocked -= amount;
                return #ok(null);
            };
            case (#Err(err)) {
                return #err(#TransferFailed("ckBTC withdrawal failed."));
            };
        };
    };

    /**
     * @notice Creates a new loan against deposited collateral.
     * @param collateralAmount Amount of ckBTC satoshis to lock as collateral.
     * @param loanAmount Amount of stablecoin units to borrow.
     * @param durationDays The duration of the loan.
     * @return A Result with the new LoanId or an AppError.
     */
    public shared (msg) func createLoan(collateralAmount : Nat, loanAmount : Nat, durationDays : Nat) : async Result.Result<LoanId, AppError> {
        let caller = msg.caller;
        if (collateralAmount == 0 or loanAmount == 0) {
            return #err(#InvalidAmount);
        };
        if (durationDays == 0 or durationDays > maxLoanDurationDays) {
            return #err(#InvalidLoanDuration);
        };
        if (collateralAmount > getAvailableCollateral(caller)) {
            return #err(#InsufficientCollateral);
        };

        // 1. Check collateralization ratio
        switch (await getBtcUsdPrice()) {
            case (#err(err)) { return #err(err) };
            case (#ok(btcPrice)) {
                // Calculate collateral value in USD, scaled by 10^(PRICE_DECIMALS)
                // ckBTC has 8 decimals.
                let collateralValueUsd = (collateralAmount * btcPrice) / (10 ** 8);

                // Assuming stablecoin has 6 decimals
                let stablecoinDecimals = 6;
                let loanValueUsd = loanAmount / (10 ** stablecoinDecimals);

                // Max loan value allowed
                let maxLoanValue = (collateralValueUsd * 100) / requiredCollateralRatio;

                if (loanValueUsd > maxLoanValue) {
                    return #err(#LoanExceedsCollateralRatio);
                };
            };
        };

        // 2. Check if platform has enough liquidity
        let fee = (loanAmount * borrowFeeBps) / 10000;
        let amountToDisburse = if (fee >= loanAmount) 0 else (loanAmount - fee);
        // This requires a query to the stablecoin canister to get our own balance
        let ourStablecoinBalance = await stablecoinCanister.icrc1_balance_of({
            owner = ownPrincipal;
            subaccount = null;
        });
        if (ourStablecoinBalance < loanAmount) {
            return #err(#InsufficientPlatformLiquidity);
        };

        // 3. Create and store the loan
        let loanId = nextLoanId;
        nextLoanId += 1;
        let now = Time.now();

        let newLoan : Loan = {
            id = loanId;
            borrower = caller;
            collateralAmount = collateralAmount;
            loanAmount = loanAmount;
            startTimestamp = now;
            endTimestamp = now + Nat64.toNat(Nat64.fromIntWrap(durationDays) * Nat64.fromNat(24 * 60 * 60 * 1_000_000_000));
            interestRateBps = interestRatePerYearBps;
            active = true;
            liquidated = false;
        };
        loans.put(loanId, newLoan);

        // 4. Update platform stats
        totalLoansOutstanding += loanAmount;
        protocolFeeBalance += fee;

        // 5. Disburse the loan (transfer stablecoin to borrower)
        let transfer_res = await stablecoinCanister.icrc1_transfer({
            to = { owner = caller; subaccount = null };
            amount = amountToDisburse;
            fee = null;
            memo = null;
            created_at_time = null;
        });

        switch (transfer_res) {
            case (#Ok(_)) { return #ok(loanId) };
            case (#Err(err)) {
                // CRITICAL: Revert state changes if transfer fails
                let _ = loans.remove(loanId);
                totalLoansOutstanding -= loanAmount;
                protocolFeeBalance -= fee;
                return #err(#TransferFailed("Failed to disburse loan."));
            };
        };
    };

    /**
     * @notice Repays a loan.
     * @dev User must first `approve` this canister to spend their stablecoin.
     * @param loanId The ID of the loan to repay.
     * @return A Result indicating success or an AppError.
     */
    public shared (msg) func repayLoan(loanId : LoanId) : async Result.Result<Null, AppError> {
        let caller = msg.caller;
        switch (loans.get(loanId)) {
            case (null) { return #err(#LoanNotFound) };
            case (?loan) {
                if (loan.borrower != caller) { return #err(#Unauthorized) };
                if (not loan.active) { return #err(#LoanNotActive) };

                let totalDue = calculateTotalDue(loan);

                // Transfer stablecoin from borrower to this canister
                let transfer_res = await stablecoinCanister.icrc2_transfer_from({
                    spender_subaccount = null;
                    from = { owner = caller; subaccount = null };
                    to = { owner = ownPrincipal; subaccount = null };
                    amount = totalDue;
                    fee = null;
                    memo = null;
                    created_at_time = null;
                });

                switch (transfer_res) {
                    case (#Ok(_)) {
                        // Close the loan
                        let repaidLoan = {
                            id = loan.id;
                            borrower = loan.borrower;
                            collateralAmount = loan.collateralAmount;
                            loanAmount = loan.loanAmount;
                            startTimestamp = loan.startTimestamp;
                            endTimestamp = loan.endTimestamp;
                            interestRateBps = loan.interestRateBps;
                            active = false;
                            liquidated = loan.liquidated;
                        };
                        loans.put(loanId, repaidLoan);

                        // Update stats
                        totalLoansOutstanding -= loan.loanAmount;
                        // The interest portion of `totalDue` increases platform revenue.
                        // We can track this separately if needed.

                        return #ok(null);
                    };
                    case (#Err(err)) {
                        return #err(#TransferFailed("Stablecoin repayment failed. Ensure you have approved this canister."));
                    };
                };
            };
        };
    };

    // =================================================================================================
    // AUTOMATION & LIQUIDATION (Alternative to Chainlink Automation)
    // =================================================================================================
    // This function is called periodically by the timer we set up.
    // NOTE: This is a system function that can be called by a timer.
    // Since we can't have private async functions in Motoko, we make it public but system-only.
    public func checkAllLoansForLiquidation() : async () {
        debug_print(" Kicking off liquidation check...");

        // Fetch price once for the entire batch to save cycles and for consistency.
        switch (await getBtcUsdPrice()) {
            case (#err(e)) {
                // If oracle fails, we can't liquidate. Log and try again next time.
                debug_print("❌ Price oracle failed, skipping liquidation check");
                return;
            };
            case (#ok(btcPrice)) {
                // Iterate through all loans. For a large number of loans, this should
                // be done in batches to avoid exceeding instruction limits.
                for ((id, loan) in loans.entries()) {
                    if (loan.active and not loan.liquidated) {
                        if (shouldLiquidate(loan, btcPrice)) {
                            // Perform liquidation
                            let liquidatedLoan = {
                                id = loan.id;
                                borrower = loan.borrower;
                                collateralAmount = loan.collateralAmount;
                                loanAmount = loan.loanAmount;
                                startTimestamp = loan.startTimestamp;
                                endTimestamp = loan.endTimestamp;
                                interestRateBps = loan.interestRateBps;
                                active = false;
                                liquidated = true;
                            };
                            loans.put(id, liquidatedLoan);

                            // The collateral is now owned by the protocol.
                            // To realize the value, the protocol would need a mechanism
                            // to sell this ckBTC on a DEX like ICDex or ICPSwap.
                            // The user's `userCollateral` balance is reduced.
                            let borrowerCollateral = switch (userCollateral.get(loan.borrower)) {
                                case (null) { 0 };
                                case (?val) { val };
                            };
                            if (borrowerCollateral >= loan.collateralAmount) {
                                userCollateral.put(loan.borrower, borrowerCollateral - loan.collateralAmount);
                            };

                            // Update platform stats
                            totalLoansOutstanding -= loan.loanAmount;

                            debug_print("✅ Loan " # Nat.toText(id) # " liquidated.");
                        };
                    };
                };
            };
        };

        debug_print(" Liquidation check finished.");
    };

    public query func getUserCollateral(user : Principal) : async Nat {
        switch (userCollateral.get(user)) {
            case (null) { return 0 };
            case (?val) { return val };
        };
    };
    // =================================================================================================

    public query func getLoan(loanId : LoanId) : async ?Loan {
        return loans.get(loanId);
    };

    // =================================================================================================
    // PRIVATE HELPERS
    // =================================================================================================

    private func isOwner(caller : Principal) {
        if (caller != owner) {
            Debug.trap("Unauthorized: only the owner can perform this action"); // Fixed
        };
    };

    private func getAvailableCollateral(user : Principal) : Nat {
        let total = switch (userCollateral.get(user)) {
            case (null) { 0 };
            case (?val) { val };
        };
        var locked : Nat = 0;
        for ((_, loan) in loans.entries()) {
            if (loan.borrower == user and loan.active) {
                locked += loan.collateralAmount;
            };
        };

        return total - locked;
    };

    private func calculateInterest(loan : Loan) : Nat {
        let now = Time.now();
        let loanEnd = if (now > loan.endTimestamp) { now } else {
            loan.endTimestamp;
        };
        let durationNs = loanEnd - loan.startTimestamp;
        // Convert duration from nanoseconds to years (approximation)
        let durationYears = Nat64.toNat(Nat64.fromIntWrap(durationNs) / Nat64.fromNat(365 * 24 * 60 * 60 * 1_000_000_000));

        // Apply interest rate (interestRateBps / 10000 = rate as a decimal)
        return (loan.loanAmount * loan.interestRateBps * durationYears) / 10000;
    };

    private func calculateTotalDue(loan : Loan) : Nat {
        let interest = calculateInterest(loan);
        return loan.loanAmount + interest;
    };

    private func shouldLiquidate(loan : Loan, btcPrice : Nat) : Bool {
        // Calculate collateral value in USD, scaled
        let collateralValueUsd = (loan.collateralAmount * btcPrice) / (10 ** 8);

        // Calculate total loan value, scaled
        let stablecoinDecimals = 6;
        let totalDue = calculateTotalDue(loan);
        let loanValueUsd = totalDue / (10 ** stablecoinDecimals);

        if (loanValueUsd == 0) return false;

        // Calculate current collateral ratio
        let currentRatio = (collateralValueUsd * 100) / loanValueUsd;

        return currentRatio < liquidationThreshold;
    };

    // =================================================================================================
    // ADMIN FUNCTIONS
    // =================================================================================================

    public shared (msg) func updateCollateralRatio(newRatio : Nat) {
        isOwner(msg.caller);
        requiredCollateralRatio := newRatio;
    };

    public shared (msg) func withdrawFees(amount : Nat) : async Result.Result<Null, AppError> {
        isOwner(msg.caller);
        if (amount > protocolFeeBalance) { return #err(#InsufficientBalance) };

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
                return #ok(null);
            };
            case (#Err(err)) {
                return #err(#TransferFailed("Fee withdrawal failed."));
            };
        };
    };

    // Helper for debugging
    private func debug_print(text : Text) {
        Debug.print(text);
    };
};
