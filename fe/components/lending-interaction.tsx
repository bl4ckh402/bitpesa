'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useBitPesa } from "@/lib/hooks/useBitPesa";
import { useTokenAllowance } from "@/lib/hooks/useTokenAllowance";
import { parseUnits } from "viem";

export function LendingInteraction() {
  const [amount, setAmount] = useState('');
  const { 
    address, 
    isConnected, 
    btcPrice, 
    userCollateral,
    contractHooks: {
      useDepositCollateral,
      useApproveWBTC,
      useWBTCBalance
    }
  } = useBitPesa();
  
  // WBTC balance
  const { balance: wbtcBalance } = useWBTCBalance(address);
  
  // Check WBTC allowance
  const { allowance, hasAllowance } = useTokenAllowance('WBTC', address);
    // Set up approval
  const { approve, isPending: isApprovePending } = useApproveWBTC();
  
  // Set up deposit
  const { deposit, isPending: isDepositPending } = useDepositCollateral();
    // Handle approval
  const handleApprove = () => {
    if (!amount || !address) return;
    approve(amount);
  };
  
  // Handle deposit
  const handleDeposit = () => {
    if (!amount) return;
    deposit(amount);
  };
    // Check if needs approval
  const needsApproval = () => {
    if (!amount) return false;
    const amountToCheck = parseUnits(amount, 8);
    return !hasAllowance(amountToCheck as bigint);
  };
  
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deposit WBTC Collateral</CardTitle>
          <CardDescription>Connect your wallet to manage collateral</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit WBTC Collateral</CardTitle>
        <CardDescription>Your WBTC Balance: {wbtcBalance || '0.0'} WBTC</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="amount">Amount to Deposit</Label>
            <Input
              id="amount"
              placeholder="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {needsApproval() ? (
          <Button onClick={handleApprove} disabled={isApprovePending}>
            {isApprovePending ? 'Approving...' : 'Approve WBTC'}
          </Button>
        ) : (
          <Button onClick={handleDeposit} disabled={isDepositPending || !amount}>
            {isDepositPending ? 'Depositing...' : 'Deposit Collateral'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
