import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import { ICRC1 } from "./ICRC1.mo";

/**
 * @title BitPesa WBTC Lending Canister (Motoko)
 * @dev A DeFi platform on the Internet Computer that allows users to deposit
 *      ICRC-1 compliant ckBTC as collateral and take loans in an ICRC-1 stablecoin (e.g., ckUSDC).
 *      - Uses HTTPS Outcalls for accurate ckBTC/USD price data.
 *      - Uses Canister Timers for automated liquidation checks.
 */
actor class BitPesaLending(init : Config) {

    // Configuration provided on canister creation
    public type Config = {
        owner : Principal;
        ckbtc_canister : Principal;
        stablecoin_canister : Principal;
    };

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
    let ckbtcCanister : ICRC1 = actor (init.ckbtc_canister);
    let stablecoinCanister : ICRC1 = actor (init.stablecoin_canister);

    stable var requiredCollateralRatio : Nat = 150; // 150%
    stable var liquidationThreshold : Nat = 125; // 125%
    stable var borrowFeeBps : Nat = 50; // 0.5% fee on borrowed amount (50 bps)
    stable var interestRatePerYearBps : Nat = 500; // 5% APR (500 bps)

    stable var loansEntries : [(LoanId, Loan)] = [];
    var loans = HashMap.HashMap<LoanId, Loan>(10, Nat.equal, Nat.hash);
    stable var nextLoanId : LoanId = 0;
    
    stable var userCollateralEntries : [(Principal, Nat)] = [];
    var userCollateral = HashMap.HashMap<Principal, Nat>(10, Principal.equal, Principal.hash);
    stable var userCollateral = StableBTreeMap.init<Principal, Nat>();

    stable var totalCollateralLocked : Nat = 0;
    stable var totalLoansOutstanding : Nat = 0;
    stable var protocolFeeBalance : Nat = 0; // In stablecoin units

    var liquidationTimer : ?Timer.TimerId = null;

    private func post_upgrade_init() {
        let interval = 5 * 60 * 1_000_000_000; // 5 minutes in nanoseconds
    };
    
    // Initialize HashMap from stable storage during upgrades
    system func preupgrade() {
        loansEntries := Iter.toArray(loans.entries());
        userCollateralEntries := Iter.toArray(userCollateral.entries());
    };

    system func postupgrade() {
        loans := HashMap.fromIter<LoanId, Loan>(loansEntries.vals(), 10, Nat.equal, Nat.hash);
        userCollateral := HashMap.fromIter<Principal, Nat>(userCollateralEntries.vals(), 10, Principal.equal, Principal.hash);
        post_upgrade_init();
    };
    
    post_upgrade_init();

    let BTC_USD_PRICE_API = "https://api.coinbase.com/v2/prices/BTC-USD/spot";

    post_upgrade_init();

    let BTC_USD_PRICE_API = "https://api.coinbase.com/v2/prices/BTC-USD/spot";
    let PRICE_DECIMALS = 2;

    // This function will be called by the IC to sanitize the HTTP response.
    // This is a CRITICAL step for security and determinism.
    public query func transform(raw : Management.HttpResponse) : Management.HttpResponse {
        // Remove all headers except 'Date' for security reasons
        var sanitized_headers = [];
        for (h in raw.headers) {
            if (Text.toLower(h.name) == "date") {
                sanitized_headers := Array.append<Management.HttpHeader>([h], sanitized_headers);
            };
        };
        // Return the sanitized response, keeping the body
        { raw with headers = sanitized_headers };
    };

    /**
     * @notice Fetches the latest BTC/USD price.
     * @dev Uses HTTPS Outcalls. Returns price as an integer, scaled by 10^PRICE_DECIMALS (e.g., 65000.12 -> 6500012)
     * @return Result containing the price or an error.
     */
    async func getBtcUsdPrice() : Result.Result<Nat, AppError> {
        // Cost of this call is ~0.1B cycles, must be covered by the canister balance.
        let cycles_cost : Nat64 = 100_000_000;

        let res = await Management.http_request(
            {
                url = BTC_USD_PRICE_API;
                max_response_bytes = ?2048;
                method = #GET;
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
                    return #Err(#PriceOracleFailed(err_msg));
                };

                // Example Response: {"data":{"base":"BTC","currency":"USD","amount":"65000.12"}}
                // We need a JSON parser. For simplicity, we'll do basic text matching.
                // In production, use a robust JSON parsing library.
                let body = Text.fromBlob(response.body);
                // A simplified parser for this specific response structure
                let prefix = "\"amount\":\"";
                let suffix = "\"}}";

                switch (Text.find(body, prefix)) {
                    case (?start_idx) {
                        let price_start = start_idx + Text.size(prefix);
                        switch (Text.find(body, suffix)) {
                            case (?end_idx) {
                                let price_str = Text.slice(body, price_start, end_idx);
                                // remove decimal point for integer math
                                let price_no_decimal = Text.replace(price_str, ".", "");
                                switch (Nat.fromText(price_no_decimal)) {
                                    case (?p) { return #Ok(p) };
                                    case (null) {
                                        return #Err(#PriceOracleFailed("Could not parse price from text"));
                                    };
                                };
                            };
                            case (null) {
                                return #Err(#PriceOracleFailed("Could not find price suffix in response"));
                            };
                        };
                    };
                    case (null) {
                        return #Err(#PriceOracleFailed("Could not find price prefix in response"));
                    };
                };
            };
            case (#Err(code, msg)) {
                return #Err(#PriceOracleFailed("Request failed: " # msg));
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
        if (amount == 0) { return #Err(#InvalidAmount) };

        let transfer_res = await ckbtcCanister.icrc1_transfer_from({
            spender_subaccount = null;
            from = { owner = msg.caller; subaccount = null };
            to = { owner = Principal.fromActor(this); subaccount = null };
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
                return #Ok(null);
            };
            case (#Err(err)) {
                return #Err(#TransferFailed("ckBTC deposit failed. Ensure you have approved this canister."));
            };
        };
    };

    /**
     * @notice Withdraws unused ckBTC collateral.
     * @param amount The amount of ckBTC satoshis to withdraw.
     * @return A Result indicating success or an AppError.
     */
    public shared (msg) func withdraw(amount : Nat) : async Result.Result<Null, AppError> {
        if (amount == 0) { return #Err(#InvalidAmount) };

        let caller = msg.caller;
        let available_collateral = getAvailableCollateral(caller);

        if (amount > available_collateral) {
            return #Err(#InsufficientCollateral);
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
                return #Ok(null);
            };
            case (#Err(err)) {
                return #Err(#TransferFailed("ckBTC withdrawal failed."));
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
            return #Err(#InvalidAmount);
        };
        if (durationDays == 0 or durationDays > maxLoanDurationDays) {
            return #Err(#InvalidLoanDuration);
        };
        if (collateralAmount > getAvailableCollateral(caller)) {
            return #Err(#InsufficientCollateral);
        };

        // 1. Check collateralization ratio
        switch (await getBtcUsdPrice()) {
            case (#Err(err)) { return #Err(err) };
            case (#Ok(btcPrice)) {
                // Calculate collateral value in USD, scaled by 10^(PRICE_DECIMALS)
                // ckBTC has 8 decimals.
                let collateralValueUsd = (collateralAmount * btcPrice) / (10 ** 8);

                // Assuming stablecoin has 6 decimals
                let stablecoinDecimals = 6;
                let loanValueUsd = loanAmount / (10 ** stablecoinDecimals);

                // Max loan value allowed
                let maxLoanValue = (collateralValueUsd * 100) / requiredCollateralRatio;

                if (loanValueUsd > maxLoanValue) {
                    return #Err(#LoanExceedsCollateralRatio);
                };
            };
        };

        // 2. Check if platform has enough liquidity
        let fee = (loanAmount * borrowFeeBps) / 10000;
        let amountToDisburse = loanAmount - fee;
        // This requires a query to the stablecoin canister to get our own balance
        let ourStablecoinBalance = await stablecoinCanister.icrc1_balance_of({
            owner = Principal.fromActor(this);
            subaccount = null;
        });
        if (ourStablecoinBalance < loanAmount) {
            return #Err(#InsufficientPlatformLiquidity);
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
            endTimestamp = now + (Nat.toNat64(durationDays) * 24 * 60 * 60 * 1_000_000_000);
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
            // ... other params
        });

        switch (transfer_res) {
            case (#Ok(_)) { return #Ok(loanId) };
            case (#Err(err)) {
                // CRITICAL: Revert state changes if transfer fails
                loans.remove(loanId);
                totalLoansOutstanding -= loanAmount;
                protocolFeeBalance -= fee;
                return #Err(#TransferFailed("Failed to disburse loan."));
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
            case (null) { return #Err(#LoanNotFound) };
            case (?loan) {
                if (loan.borrower != caller) { return #Err(#Unauthorized) };
                if (not loan.active) { return #Err(#LoanNotActive) };

                let totalDue = calculateTotalDue(loan);

                // Transfer stablecoin from borrower to this canister
                let transfer_res = await stablecoinCanister.icrc1_transfer_from({
                    from = { owner = caller; subaccount = null };
                    to = {
                        owner = Principal.fromActor(this);
                        subaccount = null;
                    };
                    amount = totalDue;
                    // ... other params
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

                        return #Ok(null);
                    };
                    case (#Err(err)) {
                        return #Err(#TransferFailed("Stablecoin repayment failed. Ensure you have approved this canister."));
                    };
                };
            };
        };
    };

    // =================================================================================================
    // AUTOMATION & LIQUIDATION (Alternative to Chainlink Automation)
    // =================================================================================================
    // This function is called periodically by the timer we set up.
    // NOTE: This is a private function, it cannot be called externally.
    // Making it async allows it to make await calls (like fetching the price).
    private async func checkAllLoansForLiquidation() {
        debug_print(" Kicking off liquidation check...");

        // Fetch price once for the entire batch to save cycles and for consistency.
        switch (await getBtcUsdPrice()) {
            case (#Err(e)) {
                // If oracle fails, we can't liquidate. Log and try again next time.
                debug_print("❌ Price oracle failed, skipping liquidation check");
                return;
            };
            case (#Ok(btcPrice)) {
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

    private func isOwner() {
        if (caller() != owner) {
            Error.trap(#Unauthorized);
        };
    };

    private func getAvailableCollateral(user : Principal) : Nat {
        let total = switch (userCollateral.get(user)) {
            case (null) { 0 };
            case (?val) { val };
        };
        var locked : Nat = 0;
        for ((_, loan) in loans.entries()) {};
        let timeElapsed = (Time.now() - loan.startTimestamp) / 1_000_000_000; // in seconds
        return (loan.loanAmount * loan.interestRateBps * Nat.fromNat64(timeElapsed)) / (10000 * SECONDS_IN_YEAR);
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
        isOwner();
        requiredCollateralRatio := newRatio;
    };

    public shared (msg) func withdrawFees(amount : Nat) : async Result.Result<Null, AppError> {
        isOwner();
        if (amount > protocolFeeBalance) { return #Err(#InsufficientBalance) };

        let transfer_res = await stablecoinCanister.icrc1_transfer({
            to = { owner = owner; subaccount = null };
            amount = amount;
            //...
        });

        switch (transfer_res) {
            case (#Ok(_)) {
                protocolFeeBalance -= amount;
                return #Ok(null);
            };
            case (#Err(err)) {
                return #Err(#TransferFailed("Fee withdrawal failed."));
            };
        };
    };

    // Helper for debugging
    private func debug_print(text : Text) {
        Debug.print(text);
    };
};
