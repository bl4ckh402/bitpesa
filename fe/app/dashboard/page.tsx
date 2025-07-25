"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useBitPesaLendingCanister } from "@/lib/hooks/useBitPesaLendingCanister";
import { useICP } from "@/lib/hooks/useICP";
import { Loan, Satoshi } from "@/lib/types/icp";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Helper function to convert Satoshis to BTC
const satoshiToBTC = (sats: bigint | number): number => {
  return Number(sats) / 100000000;
};

// Helper function to format timestamp
const formatTimestamp = (timestamp: bigint): string => {
  // Convert nanoseconds to milliseconds
  const date = new Date(Number(timestamp) / 1000000);
  return date.toLocaleString();
};

// Helper function to format numbers for display
const formatNumber = (num: number | bigint | null, decimals: number = 2): string => {
  if (num === null) return '0';
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export default function MotokoPage() {
  // Modal states
  const [showLoanTerms, setShowLoanTerms] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  
  // Action states
  const [isCreatingLoan, setIsCreatingLoan] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);
  
  // Form states
  const [loanAmount, setLoanAmount] = useState<string>("1000");
  const [loanDuration, setLoanDuration] = useState<number>(30);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("0.001");

  // Get ICP authentication state
  const { isAuthenticated, principal, login } = useICP();

  // Get data from canister
  const {
    isLoading,
    error,
    isConnected,
    
    // Bitcoin Integration Methods
    getUserBitcoinAddress,
    getUserBitcoinBalance,
    depositBitcoinCollateral,
    getUserBitcoinCollateral,
    generateUserBitcoinAddress,
    withdrawBitcoinCollateral,

    // Price Oracle Methods
    getBtcUsdPrice,

    // Lending Methods
    createBitcoinLoan,
    repayLoan,

    // Query Methods
    getLoan,
    getAvailableCollateral,
    getUserLoans,
    getPlatformStats,
  } = useBitPesaLendingCanister();

  // State for user data
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null);
  const [bitcoinBalance, setBitcoinBalance] = useState<bigint | null>(null);
  const [bitcoinCollateral, setBitcoinCollateral] = useState<bigint | null>(null);
  const [availableCollateral, setAvailableCollateral] = useState<bigint | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  
  // Derived state
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  
  // Load initial data
  useEffect(() => {
    if (isAuthenticated && isConnected) {
      loadUserData();
    }
  }, [isAuthenticated, isConnected]);

  // Load all user data
  const loadUserData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Get BTC price
      const priceResult = await getBtcUsdPrice();
      if (priceResult.data) {
        setBtcPrice(Number(priceResult.data) / 100); // Adjust based on your price format
      }
      
      // Get user's Bitcoin address or generate one if needed
      const addressResult = await getUserBitcoinAddress();
      if (addressResult.data && typeof addressResult.data === "string") {
        setBitcoinAddress(addressResult.data);
      } else {
        // Generate a new address if none exists
        const newAddressResult = await generateUserBitcoinAddress();
        if (newAddressResult.data && typeof newAddressResult.data === "string") {
          setBitcoinAddress(newAddressResult.data);
        }
      }
      
      // Get user's Bitcoin balance
      const balanceResult = await getUserBitcoinBalance();
      if (balanceResult.data) {
        setBitcoinBalance(balanceResult.data);
      }
      
      // Get user's Bitcoin collateral
      const collateralResult = await getUserBitcoinCollateral();
      if (collateralResult.data) {
        setBitcoinCollateral(collateralResult.data as bigint);
      }
      
      // Get available collateral
      const availableResult = await getAvailableCollateral();
      if (availableResult.data) {
        setAvailableCollateral(availableResult.data as bigint);
      }
      
      // Get user loans
      const loansResult = await getUserLoans();
      if (loansResult.data) {
        const loansList = loansResult.data as Loan[];
        setLoans(loansList);
        // Filter active loans
        const active = loansList.filter(loan => loan.active);
        setActiveLoans(active);
      }
      
      // Get platform stats
      const statsResult = await getPlatformStats();
      if (statsResult.data) {
        setPlatformStats(statsResult.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsRefreshing(false);
    }
  }, [
    getBtcUsdPrice, 
    getUserBitcoinAddress, 
    getUserBitcoinBalance,
    getUserBitcoinCollateral,
    getAvailableCollateral,
    getUserLoans,
    getPlatformStats
  ]);
  
  // Handler for generating a Bitcoin address
  const handleGenerateAddress = useCallback(async () => {
    setIsGeneratingAddress(true);
    try {
      const result = await generateUserBitcoinAddress();
      if (result.data) {
        setBitcoinAddress(result.data);
        toast.success('Bitcoin address generated successfully');
      } else if (result.error) {
        toast.error(`Failed to generate Bitcoin address: ${result.error}`);
      }
    } catch (err) {
      console.error('Error generating address:', err);
      toast.error('Failed to generate Bitcoin address');
    } finally {
      setIsGeneratingAddress(false);
    }
  }, [generateUserBitcoinAddress]);
  
  // Handler for depositing Bitcoin collateral
  const handleDepositCollateral = useCallback(async () => {
    try {
      const result = await depositBitcoinCollateral();
      if (result.data) {
        toast.success(`Successfully deposited ${satoshiToBTC(result.data)} BTC as collateral`);
        // Reload data to show updated balances
        loadUserData();
      } else if (result.error) {
        toast.error(`Deposit failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Error depositing collateral:', err);
      toast.error('Failed to deposit collateral');
    }
  }, [depositBitcoinCollateral, loadUserData]);
  
  // Handler for creating a loan
  const handleCreateLoan = useCallback(async () => {
    setIsCreatingLoan(true);
    try {
      // Convert string to bigint with proper decimal handling
      const loanAmountBigInt = BigInt(Math.floor(Number(loanAmount) * 100));
      
      const result = await createBitcoinLoan(loanAmountBigInt, loanDuration);
      if (result.data) {
        toast.success(`Loan created successfully! Loan ID: ${result.data}`);
        setShowLoanTerms(false);
        // Reload data to show the new loan
        loadUserData();
      } else if (result.error) {
        toast.error(`Failed to create loan: ${result.error}`);
      }
    } catch (err) {
      console.error('Error creating loan:', err);
      toast.error('Failed to create loan');
    } finally {
      setIsCreatingLoan(false);
    }
  }, [loanAmount, loanDuration, createBitcoinLoan, loadUserData]);
  
  // Handler for repaying a loan
  const handleRepayLoan = useCallback(async (loanId: bigint) => {
    setIsRepaying(true);
    try {
      const result = await repayLoan(loanId);
      if (result.data) {
        toast.success('Loan repaid successfully!');
        // Reload data to show the updated loan status
        loadUserData();
      } else if (result.error) {
        toast.error(`Failed to repay loan: ${result.error}`);
      }
    } catch (err) {
      console.error('Error repaying loan:', err);
      toast.error('Failed to repay loan');
    } finally {
      setIsRepaying(false);
    }
  }, [repayLoan, loadUserData]);
  
  // Handler for withdrawing Bitcoin collateral
  const handleWithdrawCollateral = useCallback(async () => {
    setIsWithdrawing(true);
    try {
      // Convert BTC amount to satoshis
      const withdrawAmountSats = BigInt(Math.floor(Number(withdrawAmount) * 100000000));
      
      if (!recipientAddress) {
        toast.error('Please enter a valid recipient Bitcoin address');
        setIsWithdrawing(false);
        return;
      }
      
      const result = await withdrawBitcoinCollateral(withdrawAmountSats, recipientAddress);
      if (result.data) {
        toast.success('Withdrawal initiated successfully!');
        setShowWithdraw(false);
        // Reload data to show updated balances
        loadUserData();
      } else if (result.error) {
        toast.error(`Withdrawal failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Error withdrawing collateral:', err);
      toast.error('Failed to withdraw collateral');
    } finally {
      setIsWithdrawing(false);
    }
  }, [withdrawAmount, recipientAddress, withdrawBitcoinCollateral, loadUserData]);

  // Render UI based on authentication state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Welcome to BitPesa Lending</CardTitle>
            <CardDescription>
              Connect with Internet Identity to access the lending platform
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button 
              onClick={login} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>Connect with Internet Identity</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render main dashboard UI
  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">BitPesa Lending Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadUserData}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Undo2 className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">BTC Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Bitcoin className="mr-2 h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">
                ${btcPrice ? formatNumber(btcPrice) : '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your BTC Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Bitcoin className="mr-2 h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">
                {bitcoinBalance ? formatNumber(satoshiToBTC(bitcoinBalance), 8) : '0.00000000'} BTC
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deposited Collateral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Shield className="mr-2 h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">
                {bitcoinCollateral ? formatNumber(satoshiToBTC(bitcoinCollateral), 8) : '0.00000000'} BTC
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Collateral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Shield className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">
                {availableCollateral ? formatNumber(satoshiToBTC(availableCollateral), 8) : '0.00000000'} BTC
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Tabs */}
      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="wallet">Bitcoin Wallet</TabsTrigger>
          <TabsTrigger value="loans">Your Loans</TabsTrigger>
          <TabsTrigger value="platform">Platform Stats</TabsTrigger>
        </TabsList>
        
        {/* Bitcoin Wallet Tab */}
        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Bitcoin Wallet</CardTitle>
              <CardDescription>
                Deposit Bitcoin to use as collateral for loans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Your Bitcoin Address</Label>
                <div className="flex gap-2 items-center">
                  {bitcoinAddress ? (
                    <div className="p-3 bg-muted rounded-md flex-1 font-mono text-xs break-all">
                      {bitcoinAddress}
                    </div>
                  ) : (
                    <div className="p-3 bg-muted rounded-md flex-1 text-muted-foreground">
                      No address generated
                    </div>
                  )}
                  <Button 
                    onClick={handleGenerateAddress} 
                    disabled={isGeneratingAddress || !!bitcoinAddress}
                    variant="outline"
                  >
                    {isGeneratingAddress ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
                    ) : (
                      <>Generate Address</>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send BTC to this address, then click "Deposit as Collateral" to use it on the platform.
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-2">
                <Button 
                  onClick={handleDepositCollateral} 
                  disabled={!bitcoinAddress || satoshiToBTC(bitcoinBalance || BigInt(0)) <= 0}
                  className="flex-1"
                >
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  Deposit as Collateral
                </Button>
                <Button 
                  onClick={() => setShowWithdraw(true)}
                  disabled={satoshiToBTC(availableCollateral || BigInt(0)) <= 0}
                  variant="outline" 
                  className="flex-1"
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Withdraw BTC
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Loans Tab */}
        <TabsContent value="loans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Loans</CardTitle>
                <Button onClick={() => setShowLoanTerms(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Loan
                </Button>
              </div>
              <CardDescription>
                Manage your current loans and repayments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loans.length > 0 ? (
                <div className="space-y-4">
                  {loans.map((loan) => (
                    <Card key={loan.id.toString()} className="overflow-hidden">
                      <div className="p-4 border-b">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">Loan #{loan.id.toString()}</h3>
                            <p className="text-sm text-muted-foreground">
                              Created: {formatTimestamp(loan.startTimestamp)}
                            </p>
                          </div>
                          <Badge variant={loan.active ? "default" : "secondary"}>
                            {loan.active ? "Active" : "Closed"}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Loan Amount</p>
                          <p className="font-medium">${Number(loan.loanAmount) / 100}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Collateral</p>
                          <p className="font-medium">{formatNumber(satoshiToBTC(loan.collateralAmount), 8)} BTC</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">End Date</p>
                          <p className="font-medium">{formatTimestamp(loan.endTimestamp)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Interest Rate</p>
                          <p className="font-medium">{Number(loan.interestRateBps) / 100}%</p>
                        </div>
                      </div>
                      {loan.active && (
                        <div className="p-4 bg-muted border-t">
                          <Button
                            onClick={() => handleRepayLoan(loan.id)}
                            disabled={isRepaying}
                            className="w-full"
                          >
                            {isRepaying ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Repay Loan
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>You don't have any loans yet</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowLoanTerms(true)}
                    className="mt-2"
                  >
                    Create your first loan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Platform Stats Tab */}
        <TabsContent value="platform" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Statistics</CardTitle>
              <CardDescription>
                Overview of the BitPesa lending platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {platformStats ? (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Loans</p>
                    <p className="text-2xl font-bold">{platformStats.totalLoans.toString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total BTC Collateral</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(satoshiToBTC(platformStats.totalBitcoinCollateral), 8)} BTC
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Outstanding Loans</p>
                    <p className="text-2xl font-bold">${Number(platformStats.totalOutstanding) / 100}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Platform Fees Accumulated</p>
                    <p className="text-2xl font-bold">${Number(platformStats.protocolFees) / 100}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2">Loading platform statistics...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Loan Terms Modal */}
      <Dialog open={showLoanTerms} onOpenChange={setShowLoanTerms}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Loan</DialogTitle>
            <DialogDescription>
              Enter the loan details and terms
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Loan Amount (USD)</Label>
              <Input
                id="loanAmount"
                type="number"
                min="100"
                step="100"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Min: $100, Max: Based on available collateral
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loanDuration">Loan Duration (Days)</Label>
              <Input
                id="loanDuration"
                type="number"
                min="1"
                max="365"
                value={loanDuration}
                onChange={(e) => setLoanDuration(parseInt(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Max duration: 365 days
              </p>
            </div>
            <div className="pt-4">
              <Button
                onClick={handleCreateLoan}
                disabled={isCreatingLoan || !loanAmount || Number(loanAmount) <= 0}
                className="w-full"
              >
                {isCreatingLoan ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Loan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Withdraw Modal */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Bitcoin</DialogTitle>
            <DialogDescription>
              Enter withdrawal details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="withdrawAmount">Amount (BTC)</Label>
              <Input
                id="withdrawAmount"
                type="number"
                min="0.00000001"
                step="0.001"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Available: {availableCollateral ? formatNumber(satoshiToBTC(availableCollateral), 8) : '0'} BTC
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientAddress">Bitcoin Address</Label>
              <Input
                id="recipientAddress"
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Enter Bitcoin address"
              />
            </div>
            <div className="pt-4">
              <Button
                onClick={handleWithdrawCollateral}
                disabled={
                  isWithdrawing || 
                  !recipientAddress || 
                  !withdrawAmount || 
                  Number(withdrawAmount) <= 0 ||
                  Number(withdrawAmount) > satoshiToBTC(availableCollateral || BigInt(0))
                }
                className="w-full"
              >
                {isWithdrawing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Withdraw Bitcoin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
