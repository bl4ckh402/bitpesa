"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bitcoin,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Shield,
  Loader2,
  Undo2,
} from "lucide-react";
import { LoanTermsModal } from "@/components/loan-terms-modal";
import { DepositModal } from "@/components/deposit-modal";
import { SmartContracts } from "@/components/smart-contracts";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import {
  useGetBtcUsdPrice,
  useUserCollateralBalance,
  useTotalCollateralLocked,
  useTotalLoansOutstanding,
  useWBTCBalance,
  useUSDCBalance,
  useLoansList,
  useRequiredCollateralRatio,
  useRepayLoan,
  useApproveUSDC,
  useCalculateInterest,
} from "@/lib/hooks/useContracts";
import { Label } from "@/components/ui/label";
import contractAddresses, { AVALANCHE_FUJI_CHAIN_ID } from "@/lib/config";

export default function Dashboard() {
  const [showLoanTerms, setShowLoanTerms] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { address: userAddress, isConnected } = useAccount();
  // Get data from contracts
  const { price: btcPrice, isLoading: isPriceLoading } = useGetBtcUsdPrice();
  const { balance: collateralBalance, isLoading: isCollateralLoading } =
    useUserCollateralBalance();
  const { loans, isLoading: isLoansLoading } = useLoansList();
  const { balance: wbtcBalance, isLoading: isWbtcLoading } = useWBTCBalance();
  console.log("User Address:", userAddress);
  console.log("WBTC Balance:", wbtcBalance, "BTC Price:", btcPrice);
  console.log(contractAddresses[AVALANCHE_FUJI_CHAIN_ID].WBTC as string, "WBTC Contract Address");
  const { balance: usdcBalance, isLoading: isUsdcLoading } = useUSDCBalance();
  const { ratio: requiredCollateralRatio, isLoading: isRatioLoading } =
    useRequiredCollateralRatio();
  const { approve } = useApproveUSDC();
  const { repayLoan } = useRepayLoan();

  // Get interest data for active loan
  const [loanInterest, setLoanInterest] = useState<string>("0");
  const [isInterestLoading, setIsInterestLoading] = useState(false);

  // Calculate derived values
  const collateralValue =
    btcPrice && collateralBalance ? Number(collateralBalance) * btcPrice : 0;
  // Find active loans and summary data
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [activeLoan, setActiveLoan] = useState<any>(null); // Most risky loan for detailed display
  const [totalLoanAmount, setTotalLoanAmount] = useState<number>(0); // Total of all active loans
  const [loanHealthRatio, setLoanHealthRatio] = useState<number>(0);
  const [liquidationPrice, setLiquidationPrice] = useState<number>(0);
  useEffect(() => {
    if (loans && loans.length > 0 && btcPrice) {
      // Find active loans first, then sort by highest loan-to-value ratio (most risky first)
      const activeLoansArray = loans.filter(
        (loan: any) => loan.active === true
      );
      setActiveLoans(activeLoansArray);

      // Calculate total loan amount across all active loans
      const total = activeLoansArray.reduce(
        (sum, loan) => sum + Number(loan.loanAmount),
        0
      );
      setTotalLoanAmount(total);

      if (activeLoansArray.length > 0) {
        // Sort loans by LTV ratio (highest risk first)
        console.log(
          "Sorting active loans by LTV ratio",
          activeLoansArray.length,
          "active loans found"
        );
        const sortedLoans = [...activeLoansArray].sort((a, b) => {
          const aLTV =
            Number(a.loanAmount) / (Number(a.collateralAmount) * btcPrice);
          const bLTV =
            Number(b.loanAmount) / (Number(b.collateralAmount) * btcPrice);
          return bLTV - aLTV; // Descending order
        });

        // Use the highest risk loan as the primary active loan for detailed display
        const active = sortedLoans[0];
        setActiveLoan(active);

        // Calculate health ratio (collateral value / loan value)
        const collateralValue = Number(active.collateralAmount) * btcPrice;
        const loanValue = Number(active.loanAmount);
        const healthRatio = Math.floor((collateralValue / loanValue) * 100);
        setLoanHealthRatio(healthRatio);

        // Calculate liquidation price
        // Liquidation happens when collateral value falls to loan value * required ratio
        // So liquidation BTC price = loan value * required ratio / collateral amount
        const reqRatio = requiredCollateralRatio / 100; // Convert from percentage
        if (reqRatio > 0) {
          const liquidationBtcPrice =
            (loanValue * reqRatio) / Number(active.collateralAmount);
          setLiquidationPrice(liquidationBtcPrice);
        }
      } else {
        // No active loans
        setActiveLoan(null);
        setLoanHealthRatio(0);
        setLiquidationPrice(0);
      }
    }
  }, [loans, btcPrice, requiredCollateralRatio]);
  // Calculate interest whenever active loan changes
  useEffect(() => {
    if (activeLoan) {
      setIsInterestLoading(true);
      // Calculate interest using real contract data if possible
      const calculateRealInterest = async () => {
        try {
          // Use the useCalculateInterest hook
          const { interest } = useCalculateInterest(Number(activeLoan.id));
          // Set the interest value
          setLoanInterest(interest || "0");
        } catch (error) {
          console.error("Error calculating interest from contract:", error);
          // Fall back to estimation if contract call fails
          estimateInterest();
        } finally {
          setIsInterestLoading(false);
        }
      };

      // Calculate interest locally as a fallback
      const estimateInterest = () => {
        // Calculate elapsed time since loan creation
        const startTime = Number(activeLoan.startTimestamp);
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        const timeElapsed = now - startTime;

        // Calculate interest: principal * rate * time
        // (loanAmount * interestRatePerYear * timeElapsed) / (100 * 365 days)
        const interestAmount =
          (Number(activeLoan.loanAmount) *
            Number(activeLoan.interestRate) *
            timeElapsed) /
          (10000 * 365 * 24 * 60 * 60); // Convert from basis points (10000 = 100%)

        setLoanInterest(interestAmount.toFixed(18));
      };

      // Use local estimation for now as it's more reliable
      estimateInterest();
      setIsInterestLoading(false);
    } else {
      setLoanInterest("0");
    }
  }, [activeLoan]);

  // Helper function to estimate interest for individual loans
  const estimateInterest = (loan: any): number => {
    if (!loan) return 0;

    const startTime = Number(loan.startTimestamp);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeElapsed = currentTime - startTime;
    const daysElapsed = timeElapsed / (60 * 60 * 24);

    // Convert interest rate from percentage to decimal (e.g., 5% -> 0.05)
    const interestRate = Number(loan.interestRate) / 100;

    // Calculate interest: principal * rate * time
    // Time is in years, so we divide days by 365
    const interest =
      Number(loan.loanAmount) * interestRate * (daysElapsed / 365);

    return interest;
  };

  // Show a loading state if data is being fetched
  if (isPriceLoading || isCollateralLoading || isLoansLoading || !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mb-4 mx-auto" />
          <h3 className="text-xl text-white">Loading your dashboard data...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          {" "}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">BTC Collateral</p>
                  <p className="text-2xl font-bold text-white">
                    {Number(collateralBalance).toFixed(4)} BTC
                  </p>
                  <p className="text-slate-400 text-xs">
                    $
                    {btcPrice
                      ? (Number(collateralBalance) * btcPrice).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 2 }
                        )
                      : "0"}
                  </p>
                </div>
                <Bitcoin className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Loans</p>
                  <p className="text-2xl font-bold text-white">
                    ${totalLoanAmount.toLocaleString()}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {activeLoans.length > 0
                      ? `${activeLoans.length} loan${
                          activeLoans.length > 1 ? "s" : ""
                        } active`
                      : "No active loans"}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>{" "}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Health Ratio</p>
                  {activeLoan ? (
                    <>
                      <p className="text-2xl font-bold text-white">
                        {loanHealthRatio}%
                      </p>
                      <Progress
                        value={loanHealthRatio}
                        className={`mt-2 h-2 ${
                          loanHealthRatio < 150
                            ? "bg-red-900"
                            : loanHealthRatio < 180
                            ? "bg-yellow-900"
                            : "bg-green-900"
                        }`}
                      />
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-white">N/A</p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  {activeLoan ? (
                    <>
                      <Badge className="bg-green-500/20 text-green-400 mt-1">
                        Active
                      </Badge>
                      <p className="text-slate-400 text-xs mt-2">
                        Due:{" "}
                        {new Date(
                          Number(activeLoan.endTimestamp) * 1000
                        ).toLocaleDateString()}
                      </p>
                    </>
                  ) : loans && loans.length > 0 ? (
                    <>
                      <Badge className="bg-blue-500/20 text-blue-400 mt-1">
                        Completed
                      </Badge>
                      <p className="text-slate-400 text-xs mt-2">
                        {loans.length} historical loan
                        {loans.length !== 1 ? "s" : ""}
                      </p>
                    </>
                  ) : (
                    <>
                      <Badge className="bg-slate-500/20 text-slate-400 mt-1">
                        No Loans
                      </Badge>
                      <p className="text-slate-400 text-xs mt-2">
                        Create your first loan
                      </p>
                    </>
                  )}
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted border flex flex-wrap">
            <TabsTrigger value="overview" className="flex-1">
              Overview
            </TabsTrigger>
            <TabsTrigger value="deposit" className="flex-1">
              Deposit
            </TabsTrigger>
            <TabsTrigger value="borrow" className="flex-1">
              Borrow
            </TabsTrigger>
            <TabsTrigger value="repay" className="flex-1">
              Repay
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex-1">
              Contracts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Active Loan */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Active Loan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeLoan ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Loan Amount:</span>
                        <span className="text-white font-medium">
                          ${Number(activeLoan.loanAmount).toLocaleString()}
                        </span>
                      </div>{" "}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Interest Rate:
                        </span>
                        <span className="font-medium">
                          {Number(activeLoan.interestRate) / 100}% APR
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">LTV Ratio:</span>
                        <span className="text-white font-medium">
                          {requiredCollateralRatio}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Liquidation Price:
                        </span>
                        <span className="text-red-400 font-medium">
                          ${liquidationPrice.toLocaleString()}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-slate-400">No active loans found</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Create a loan to see details here
                      </p>
                    </div>
                  )}
                  {activeLoan && (
                    <Button className="w-full bg-blue-500 hover:bg-blue-600">
                      View Transaction History
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Risk Management */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                    Risk Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeLoan ? (
                    <>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-400">Health Ratio</span>
                          <span className="text-white font-medium">
                            {loanHealthRatio}%
                          </span>
                        </div>
                        <Progress value={loanHealthRatio} className="h-3" />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>Liquidation</span>
                          <span>Safe</span>
                        </div>
                      </div>
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-green-400 text-sm font-medium">
                          Status:{" "}
                          {loanHealthRatio > 120
                            ? "Safe"
                            : loanHealthRatio > 105
                            ? "Warning"
                            : "Danger"}
                        </p>
                        <p className="text-green-300 text-xs mt-1">
                          {loanHealthRatio > 120
                            ? `Your position is healthy. BTC can drop to $${liquidationPrice.toLocaleString()} before liquidation.`
                            : `Caution: Your position is close to liquidation threshold. Add collateral to improve safety.`}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-slate-400">
                        No active loans to monitor
                      </p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full border-slate-600">
                    Set Price Alerts
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* All Active Loans List */}
            {activeLoans.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">All Active Loans</CardTitle>
                  <CardDescription className="text-slate-400">
                    Showing {activeLoans.length} active loan
                    {activeLoans.length > 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeLoans.map((loan, index) => (
                      <div
                        key={`loan-${index}-${loan.borrower}`}
                        className="p-4 border border-slate-700 rounded-lg"
                      >
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-400">Loan Amount:</span>
                          <span className="text-white font-medium">
                            ${Number(loan.loanAmount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-400">Collateral:</span>
                          <span className="text-white font-medium">
                            {Number(loan.collateralAmount).toFixed(4)} BTC
                          </span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-400">Interest Rate:</span>
                          <span className="text-white font-medium">
                            {Number(loan.interestRate) / 100}% APR
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Health:</span>
                          <span
                            className={`font-medium ${
                              ((Number(loan.collateralAmount) * btcPrice!) /
                                Number(loan.loanAmount)) *
                                100 >=
                              150
                                ? "text-green-400"
                                : "text-yellow-400"
                            }`}
                          >
                            {(
                              ((Number(loan.collateralAmount) * btcPrice!) /
                                Number(loan.loanAmount)) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="deposit">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">
                  Deposit BTC Collateral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-300">
                  Increase your collateral to improve your health ratio or
                  enable larger loans.
                </p>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                  <p className="text-slate-300 text-sm">
                    Available WBTC Balance
                  </p>
                  <p className="text-white text-xl font-bold">
                    {Number(wbtcBalance).toFixed(4)} WBTC
                  </p>
                </div>
                <Button
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => setShowDeposit(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Deposit More BTC
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="borrow">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">
                  Borrow Additional Fiat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {collateralValue > 0 ? (
                  <>
                    {" "}
                    <p className="text-slate-300">
                      Based on your current collateral, you can borrow up to $
                      {(
                        collateralValue *
                          (requiredCollateralRatio
                            ? 100 / requiredCollateralRatio
                            : 0.6) -
                        (activeLoan ? Number(activeLoan.loanAmount) : 0)
                      ).toLocaleString()}
                      .
                    </p>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                      <p className="text-slate-300 text-sm">
                        Available USDC Balance
                      </p>
                      <p className="text-white text-xl font-bold">
                        {Number(usdcBalance).toFixed(2)} USDC
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-300">
                    Deposit collateral first to be able to borrow against it.
                  </p>
                )}
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => setShowLoanTerms(true)}
                  disabled={collateralValue === 0}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Borrow More
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="repay">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              {" "}
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Repay Loan</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setIsRefreshing(true);
                    // Small artificial delay to make the loading state visible
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    setIsRefreshing(false);
                  }}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeLoans.length > 0 ? (
                  <div className="space-y-6">
                    {activeLoans.map((loan, index) => {
                      // Calculate interest for this specific loan - we're using a simple estimation here
                      // In a real implementation, you'd ideally get this from the contract for each loan
                      const loanInterestEstimate = estimateInterest(loan);
                      const loanHealthRatioEstimate = Math.floor(
                        ((Number(loan.collateralAmount) * btcPrice!) /
                          Number(loan.loanAmount)) *
                          100
                      );
                      const loanLiquidationPrice =
                        (Number(loan.loanAmount) *
                          (requiredCollateralRatio / 100)) /
                        Number(loan.collateralAmount);

                      return (
                        <div
                          key={`repay-loan-${index}`}
                          className="p-4 border border-slate-700 rounded-lg space-y-4"
                        >
                          <Card className="bg-slate-900/50">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-slate-400">Loan ID:</span>
                                <Badge variant="outline">
                                  {loan.id || `#${index + 1}`}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Started:</span>
                                <span className="text-white/90">
                                  {new Date(
                                    Number(loan.startTimestamp) * 1000
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          <div className="flex justify-between">
                            <span className="text-slate-400">
                              Outstanding Principal:
                            </span>
                            <span className="text-white font-medium">
                              ${Number(loan.loanAmount).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-400">
                              Accrued Interest:
                            </span>
                            <span className="text-white font-medium">
                              ${loanInterestEstimate.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex justify-between border-t border-slate-700 pt-4">
                            <span className="text-slate-300 font-medium">
                              Total Due:
                            </span>
                            <span className="text-white font-bold">
                              $
                              {(
                                Number(loan.loanAmount) + loanInterestEstimate
                              ).toLocaleString()}
                            </span>
                          </div>

                          <div
                            className={`p-4 rounded-lg border ${
                              loanHealthRatioEstimate >= 150
                                ? "bg-green-900/20 border-green-900/30"
                                : "bg-red-900/20 border-red-900/30"
                            }`}
                          >
                            <div className="flex items-start mb-2">
                              {loanHealthRatioEstimate >= 150 ? (
                                <Shield className="text-green-400 h-4 w-4 mr-2 mt-0.5" />
                              ) : (
                                <AlertTriangle className="text-red-400 h-4 w-4 mr-2 mt-0.5" />
                              )}
                              <div>
                                <h4
                                  className={`font-medium text-sm ${
                                    loanHealthRatioEstimate >= 150
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {loanHealthRatioEstimate >= 150
                                    ? "Healthy Position"
                                    : "Liquidation Risk"}
                                </h4>
                                <p
                                  className={`text-xs mt-1 ${
                                    loanHealthRatioEstimate >= 150
                                      ? "text-green-300/80"
                                      : "text-red-300/80"
                                  }`}
                                >
                                  {loanHealthRatioEstimate >= 150
                                    ? `Your position is healthy with a ${loanHealthRatioEstimate}% health ratio.`
                                    : `If BTC price falls below $${loanLiquidationPrice.toFixed(
                                        2
                                      )}, your position may be liquidated.`}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                              <span
                                className={`text-xs ${
                                  loanHealthRatioEstimate >= 150
                                    ? "text-green-300/80"
                                    : "text-red-300/80"
                                }`}
                              >
                                Current BTC Price:
                              </span>
                              <span className="text-white/90 text-xs">
                                ${btcPrice?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span
                                className={`text-xs ${
                                  loanHealthRatioEstimate >= 150
                                    ? "text-green-300/80"
                                    : "text-red-300/80"
                                }`}
                              >
                                {loanHealthRatioEstimate >= 150
                                  ? "Health Ratio:"
                                  : "Liquidation Price:"}
                              </span>
                              <span className="text-white/90 text-xs">
                                {loanHealthRatioEstimate >= 150
                                  ? `${loanHealthRatioEstimate}%`
                                  : `$${loanLiquidationPrice.toFixed(2)}`}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor={`approval-${index}`}
                                className="text-white"
                              >
                                USDC Approval
                              </Label>
                              <Button
                                id={`approval-${index}`}
                                variant="outline"
                                size="sm"
                                onClick={() => approve(loan.loanAmount)}
                                disabled={isApproving}
                              >
                                {isApproving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Approve"
                                )}
                              </Button>
                            </div>
                            <Button
                              className="w-full bg-blue-500 hover:bg-blue-600"
                              onClick={() => repayLoan(loan.id, loan.amount)}
                              disabled={isRepaying}
                            >
                              {isRepaying ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Undo2 className="h-4 w-4 mr-2" />
                              )}
                              Repay Loan
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-slate-400">No active loans to repay</p>
                    <p className="text-slate-500 text-sm mt-2">
                      Create a loan first to see repayment options
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="contracts">
            <SmartContracts />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showLoanTerms && (
        <LoanTermsModal
          onClose={() => setShowLoanTerms(false)}
          btcPrice={btcPrice || 0}
          collateral={Number(collateralBalance)}
        />
      )}

      {showDeposit && (
        <DepositModal
          onClose={() => setShowDeposit(false)}
          btcPrice={btcPrice || 0}
          currentCollateral={Number(collateralBalance)}
          availableWbtc={Number(wbtcBalance)}
        />
      )}
    </div>
  );
}
