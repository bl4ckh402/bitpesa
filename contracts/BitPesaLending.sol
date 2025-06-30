// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

/**
 * @title BitPesa WBTC Lending Platform
 * @dev A DeFi platform that allows users to deposit WBTC as collateral and take loans in stablecoins
 * Integrates Chainlink Price Feeds for accurate collateral valuation
 * Uses Chainlink Automation for liquidation checks
 */
contract BitPesaLending is
    ReentrancyGuard,
    Ownable,
    AutomationCompatibleInterface
{
    using SafeERC20 for IERC20;

    // Token addresses
    address public wbtcAddress;
    address public stablecoinAddress;

    // Chainlink price feed for BTC/USD
    AggregatorV3Interface public btcUsdPriceFeed;

    // Loan parameters
    uint256 public constant COLLATERAL_RATIO_DENOMINATOR = 100;
    uint256 public requiredCollateralRatio = 150; // 150% collateralization required
    uint256 public liquidationThreshold = 125; // Liquidate if CR drops below 125%
    uint256 public borrowFeePercent = 1; // 1% fee on borrowed amount
    uint256 public maxLoanDurationDays = 30;

    // Interest rate parameters (APR in basis points, 1% = 100)
    uint256 public interestRatePerYear = 500; // 5% APR

    struct Loan {
        uint256 id;
        address borrower;
        uint256 collateralAmount; // In WBTC
        uint256 loanAmount; // In stablecoin
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 interestRate; // In basis points (1% = 100)
        bool active;
        bool liquidated;
        uint256 lastInterestCalculation;
    }

    // Mapping from loan ID to loan details
    mapping(uint256 => Loan) public loans;
    uint256 public nextLoanId;

    // User balances in WBTC
    mapping(address => uint256) public userCollateralBalance;

    // Total platform stats
    uint256 public totalCollateralLocked;
    uint256 public totalLoansOutstanding;
    uint256 public platformStablecoinBalance;
    uint256 public protocolFeeBalance;

    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 collateralAmount,
        uint256 loanAmount
    );
    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 repaidAmount,
        uint256 interestPaid
    );
    event LoanLiquidated(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed liquidator,
        uint256 collateralLiquidated
    );
    event CollateralRatioUpdated(uint256 oldRatio, uint256 newRatio);

    /**
     * @param _wbtcAddress Address of the WBTC token
     * @param _stablecoinAddress Address of the stablecoin used for loans
     * @param _btcUsdPriceFeed Address of the Chainlink BTC/USD price feed
     */
    constructor(
        address _wbtcAddress,
        address _stablecoinAddress,
        address _btcUsdPriceFeed
    ) Ownable(msg.sender) {
        wbtcAddress = _wbtcAddress;
        stablecoinAddress = _stablecoinAddress;
        btcUsdPriceFeed = AggregatorV3Interface(_btcUsdPriceFeed);
    }

    /**
     * @dev Get the latest BTC/USD price from Chainlink
     * @return price in USD with 8 decimals
     */
    function getBtcUsdPrice() public view returns (uint256) {
        (, int256 price, , , ) = btcUsdPriceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        return uint256(price);
    }

    /**
     * @dev Calculate the USD value of WBTC
     * @param wbtcAmount Amount of WBTC (in wei)
     * @return USD value with decimal places
     */
    function calculateUsdValue(
        uint256 wbtcAmount
    ) public view returns (uint256) {
        uint256 btcPrice = getBtcUsdPrice();
        return (wbtcAmount * btcPrice) / 1e18;
    }

    /**
     * @dev Deposit WBTC as collateral
     * @param amount Amount of WBTC to deposit (in wei)
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than zero");

        // Transfer WBTC from user to contract
        IERC20(wbtcAddress).safeTransferFrom(msg.sender, address(this), amount);

        // Update user balance and total collateral
        userCollateralBalance[msg.sender] += amount;
        totalCollateralLocked += amount;

        emit Deposit(msg.sender, amount);
    }

    /**
     * @dev Withdraw WBTC collateral if not being used for active loans
     * @param amount Amount of WBTC to withdraw (in wei)
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        require(
            userCollateralBalance[msg.sender] >= amount,
            "Insufficient balance"
        );

        // Calculate available collateral (not being used for loans)
        uint256 usedCollateral = 0;
        for (uint256 i = 0; i < nextLoanId; i++) {
            if (loans[i].borrower == msg.sender && loans[i].active) {
                usedCollateral += loans[i].collateralAmount;
            }
        }

        require(
            userCollateralBalance[msg.sender] - usedCollateral >= amount,
            "Collateral is locked in active loans"
        );

        // Update balances
        userCollateralBalance[msg.sender] -= amount;
        totalCollateralLocked -= amount;

        // Transfer WBTC back to user
        IERC20(wbtcAddress).safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount);
    }

    /**
     * @dev Create a new loan backed by WBTC collateral
     * @param collateralAmount Amount of WBTC to use as collateral (in wei)
     * @param loanAmount Amount of stablecoin to borrow
     * @param durationDays Duration of the loan in days
     */
    function createLoan(
        uint256 collateralAmount,
        uint256 loanAmount,
        uint256 durationDays
    ) external nonReentrant {
        require(collateralAmount > 0, "Collateral must be greater than zero");
        require(loanAmount > 0, "Loan amount must be greater than zero");
        require(
            durationDays > 0 && durationDays <= maxLoanDurationDays,
            "Invalid loan duration"
        );
        require(
            userCollateralBalance[msg.sender] >= collateralAmount,
            "Insufficient collateral balance"
        );

        // Calculate USD value of collateral
        uint256 collateralValueUsd = calculateUsdValue(collateralAmount);

        // Check if loan amount is within allowable limits based on collateral ratio
        uint256 maxLoanAmountUsd = (collateralValueUsd *
            COLLATERAL_RATIO_DENOMINATOR) / requiredCollateralRatio;
        require(
            loanAmount <= maxLoanAmountUsd,
            "Loan amount exceeds collateral ratio"
        );

        // Check if platform has enough stablecoin liquidity
        require(
            platformStablecoinBalance >= loanAmount,
            "Insufficient platform liquidity"
        );

        // Calculate loan fee
        uint256 fee = (loanAmount * borrowFeePercent) / 100;
        uint256 loanAmountAfterFee = loanAmount - fee;

        // Create the loan
        uint256 loanId = nextLoanId++;
        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            collateralAmount: collateralAmount,
            loanAmount: loanAmount,
            startTimestamp: block.timestamp,
            endTimestamp: block.timestamp + (durationDays * 1 days),
            interestRate: interestRatePerYear,
            active: true,
            liquidated: false,
            lastInterestCalculation: block.timestamp
        });

        // Update platform stats
        platformStablecoinBalance -= loanAmount;
        totalLoansOutstanding += loanAmount;
        protocolFeeBalance += fee;

        // Transfer stablecoin to borrower
        IERC20(stablecoinAddress).safeTransfer(msg.sender, loanAmountAfterFee);

        emit LoanCreated(
            loanId,
            msg.sender,
            collateralAmount,
            loanAmountAfterFee
        );
    }

    /**
     * @dev Calculate interest accrued on a loan
     * @param loanId ID of the loan
     * @return Interest amount in stablecoin
     */
    function calculateInterest(uint256 loanId) public view returns (uint256) {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan is not active");

        uint256 timeElapsed = block.timestamp - loan.lastInterestCalculation;

        // Calculate interest: principal * rate * time
        // (loanAmount * interestRatePerYear * timeElapsed) / (100 * 365 days)
        return
            (loan.loanAmount * loan.interestRate * timeElapsed) /
            (10000 * 365 days);
    }

    /**
     * @dev Repay a loan and retrieve collateral
     * @param loanId ID of the loan to repay
     * @param repaymentAmount Amount of stablecoin to repay
     */
    function repayLoan(
        uint256 loanId,
        uint256 repaymentAmount
    ) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan is not active");
        require(loan.borrower == msg.sender, "Not the borrower");

        // Calculate interest
        uint256 interest = calculateInterest(loanId);
        uint256 totalDue = loan.loanAmount + interest;

        require(repaymentAmount >= totalDue, "Insufficient repayment amount");

        // Transfer stablecoin from borrower to contract
        IERC20(stablecoinAddress).safeTransferFrom(
            msg.sender,
            address(this),
            repaymentAmount
        );

        // Close the loan
        loan.active = false;
        loan.lastInterestCalculation = block.timestamp;

        // Update platform stats
        platformStablecoinBalance += repaymentAmount;
        totalLoansOutstanding -= loan.loanAmount;

        // Return collateral to user
        // Note: We don't need to update userCollateralBalance as it wasn't decreased when loan created

        emit LoanRepaid(loanId, msg.sender, repaymentAmount, interest);
    }

    /**
     * @dev Check if a loan needs liquidation based on current BTC/USD price
     * @param loanId ID of the loan to check
     * @return true if loan should be liquidated
     */
    function shouldLiquidate(uint256 loanId) public view returns (bool) {
        Loan storage loan = loans[loanId];
        if (!loan.active || loan.liquidated) {
            return false;
        }

        // Calculate current collateral value
        uint256 collateralValueUsd = calculateUsdValue(loan.collateralAmount);

        // Calculate total loan value including interest
        uint256 interest = calculateInterest(loanId);
        uint256 totalLoanValue = loan.loanAmount + interest;

        // Calculate current collateral ratio
        uint256 currentRatio = (collateralValueUsd *
            COLLATERAL_RATIO_DENOMINATOR) / totalLoanValue;

        // Return true if current ratio is below liquidation threshold
        return currentRatio < liquidationThreshold;
    }

    /**
     * @dev Liquidate an undercollateralized loan
     * @param loanId ID of the loan to liquidate
     */
    function liquidateLoan(uint256 loanId) external nonReentrant {
        require(
            shouldLiquidate(loanId),
            "Loan is not eligible for liquidation"
        );

        Loan storage loan = loans[loanId];

        // Calculate interest and total amount due
        uint256 interest = calculateInterest(loanId);
        uint256 totalDue = loan.loanAmount + interest;

        // Calculate collateral value
        uint256 collateralValueUsd = calculateUsdValue(loan.collateralAmount);

        // Mark loan as liquidated
        loan.liquidated = true;
        loan.active = false;

        // Update user's collateral balance
        // Note: collateral is now owned by the protocol

        // Update platform stats
        totalLoansOutstanding -= loan.loanAmount;

        emit LoanLiquidated(
            loanId,
            loan.borrower,
            msg.sender,
            loan.collateralAmount
        );
    }

    /**
     * @dev Update the required collateral ratio
     * @param newRatio New collateral ratio (e.g., 150 for 150%)
     */
    function updateCollateralRatio(uint256 newRatio) external onlyOwner {
        require(newRatio > 100, "Collateral ratio must be greater than 100%");
        require(newRatio <= 300, "Collateral ratio must be less than 300%");

        uint256 oldRatio = requiredCollateralRatio;
        requiredCollateralRatio = newRatio;

        emit CollateralRatioUpdated(oldRatio, newRatio);
    }

    /**
     * @dev Add liquidity to the platform's stablecoin balance
     * @param amount Amount of stablecoin to add
     */
    function addLiquidity(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");

        // Transfer stablecoin from user to contract
        IERC20(stablecoinAddress).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        // Update platform stablecoin balance
        platformStablecoinBalance += amount;
    }

    /**
     * @dev Withdraw platform fees (owner only)
     * @param amount Amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyOwner {
        require(amount <= protocolFeeBalance, "Insufficient fee balance");

        // Update fee balance
        protocolFeeBalance -= amount;
        platformStablecoinBalance -= amount;

        // Transfer stablecoin to owner
        IERC20(stablecoinAddress).safeTransfer(owner(), amount);
    }

    /**
     * @dev Implementation for Chainlink Automation
     * Checks if any loans need liquidation
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256[] memory loansToLiquidate = new uint256[](nextLoanId);
        uint256 count = 0;

        // Check each loan for liquidation eligibility
        for (uint256 i = 0; i < nextLoanId; i++) {
            if (shouldLiquidate(i)) {
                loansToLiquidate[count] = i;
                count++;
            }
        }

        // If any loans need liquidation, prepare performData
        if (count > 0) {
            upkeepNeeded = true;

            // Create fixed-size array with the exact count
            uint256[] memory finalLoans = new uint256[](count);
            for (uint256 i = 0; i < count; i++) {
                finalLoans[i] = loansToLiquidate[i];
            }

            // Pack the loan IDs into performData
            performData = abi.encode(finalLoans);
        } else {
            upkeepNeeded = false;
            performData = "";
        }
    }

    /**
     * @dev Implementation for Chainlink Automation
     * Liquidates loans that need liquidation
     */
    function performUpkeep(bytes calldata performData) external override {
        if (performData.length > 0) {
            uint256[] memory loansToLiquidate = abi.decode(
                performData,
                (uint256[])
            );

            for (uint256 i = 0; i < loansToLiquidate.length; i++) {
                uint256 loanId = loansToLiquidate[i];

                // Double-check if loan still needs liquidation
                if (shouldLiquidate(loanId)) {
                    // Liquidate the loan
                    Loan storage loan = loans[loanId];

                    if (loan.active && !loan.liquidated) {
                        // Mark loan as liquidated
                        loan.liquidated = true;
                        loan.active = false;

                        // Update stats
                        totalLoansOutstanding -= loan.loanAmount;

                        emit LoanLiquidated(
                            loanId,
                            loan.borrower,
                            address(this),
                            loan.collateralAmount
                        );
                    }
                }
            }
        }
    }
}
