"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBitPesa } from "@/lib/hooks/useBitPesa";
import { useTokenAllowance } from "@/lib/hooks/useTokenAllowance";
import {
  contractAddresses,
  AVALANCHE_FUJI_CHAIN_ID,
  ETHEREUM_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
} from "@/lib/config";
import { parseUnits } from "viem";
import { TokenBridge } from "./token-bridge";
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export function CrossChainBorrowing() {
  const [activeTab, setActiveTab] = useState("bridge");
  const [amount, setAmount] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [destinationChain, setDestinationChain] = useState(
    BASE_SEPOLIA_CHAIN_ID.toString()
  );
  
  const {
    address,
    isConnected,
    btcPrice,
    calculateRequiredCollateral,
    contractHooks: {
      useDepositCollateral,
      useCreateLoan,
      useApproveWBTCForBridge,
      useApproveUSDC,
      useWBTCBalance,
      useUSDCBalance,
      useRequiredCollateralRatio,
    },
  } = useBitPesa();

  // Get balances and required ratio
  const { balance: wbtcBalance } = useWBTCBalance(address);
  const { balance: usdcBalance } = useUSDCBalance(address);
  const { ratio: collateralRatio } = useRequiredCollateralRatio();

  // Check WBTC allowance for lending platform
  const { allowance, hasAllowance } = useTokenAllowance(
    "WBTC",
    address,
    contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaLending as string
  );
  
  // Set up lending platform operations
  const { approve, isPending: isApprovePending } = useApproveWBTCForBridge();
  const { deposit, isPending: isDepositPending } = useDepositCollateral();
  const { createLoan, isPending: isLoanPending } = useCreateLoan();
  
  // Handle approval for lending
  const handleApprove = () => {
    if (!amount || !address) return;
    approve(amount);
  };
  
  // Handle collateral deposit
  const handleDeposit = () => {
    if (!amount || !address || !hasAllowance) return;
    deposit(amount);
  };
  
  // Handle loan creation
  const handleCreateLoan = () => {
    if (!loanAmount || !address) return;
    createLoan(loanAmount);
  };
  
  // Calculate required collateral
  const requiredCollateral = calculateRequiredCollateral(
    loanAmount || "0",
    Number(collateralRatio) || 150,
    btcPrice || 60000
  );

  // Check if needs approval
  const needsApproval = () => {
    if (!amount) return false;
    const amountToCheck = parseUnits(amount, 8);
    return !hasAllowance(amountToCheck as bigint);
  };

  const isDefined = (value: string | null | undefined): value is string => {
    return value !== null && value !== undefined && value !== "";
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cross-Chain Borrowing</CardTitle>
          <CardDescription>
            Connect your wallet to use cross-chain borrowing
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cross-Chain Borrowing</CardTitle>
        <CardDescription>
          Deposit WBTC as collateral on Avalanche Fuji and bridge your loan to another chain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit & Borrow</TabsTrigger>
            <TabsTrigger value="bridge">Bridge Funds</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label>Your WBTC Balance</Label>
                <p className="text-sm text-muted-foreground">{isDefined(wbtcBalance) ? wbtcBalance : "0.0"} WBTC</p>
              </div>
              
              <div>
                <Label>WBTC Price</Label>
                <p className="text-sm text-muted-foreground">${btcPrice ? btcPrice.toLocaleString() : "0.00"} USD</p>
              </div>
              
              <div>
                <Label>Required Collateral Ratio</Label>
                <p className="text-sm text-muted-foreground">{collateralRatio ? collateralRatio : "150"}%</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">WBTC Collateral Amount</Label>
                <Input
                  id="deposit-amount"
                  placeholder="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  step="0.00000001"
                />
              </div>
              
              {needsApproval() ? (
                <Button className="w-full" onClick={handleApprove} disabled={isApprovePending || !amount}>
                  {isApprovePending ? "Approving..." : "Approve WBTC"}
                </Button>
              ) : (
                <Button className="w-full" onClick={handleDeposit} disabled={isDepositPending || !amount}>
                  {isDepositPending ? "Depositing..." : "Deposit WBTC Collateral"}
                </Button>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="loan-amount">USDC Loan Amount</Label>
                <Input
                  id="loan-amount"
                  placeholder="100"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  type="number"
                  step="1"
                />
                <p className="text-sm text-muted-foreground">
                  Required Collateral: {requiredCollateral} WBTC
                </p>
              </div>
              
              <Button className="w-full" onClick={handleCreateLoan} disabled={isLoanPending || !loanAmount}>
                {isLoanPending ? "Creating Loan..." : "Create USDC Loan"}
              </Button>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Instructions</AlertTitle>
                <AlertDescription>
                  First deposit WBTC as collateral, then create your loan in USDC. After creating your loan, go to the "Bridge Funds" tab to transfer your WBTC to another chain.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          <TabsContent value="bridge" className="mt-4">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Cross-Chain Transfer</AlertTitle>
                <AlertDescription>
                  Bridge your WBTC to another blockchain network using Chainlink CCIP. Make sure you have approved the token bridge contract to spend your WBTC.
                </AlertDescription>
              </Alert>
              
              <TokenBridge />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
