'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner"
import { useWeb3 } from '@/lib/providers/web3-provider';
import { useWBTCBalance, useApproveWBTC, useDepositCollateral } from '@/lib/hooks/useContracts';
import { contractAddresses, AVALANCHE_FUJI_CHAIN_ID } from '@/lib/config';

export default function DepositForm() {
  const { isConnected, isCorrectNetwork, switchToFujiNetwork } = useWeb3();
  const [amount, setAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const { balance: wbtcBalance, isLoading: balanceLoading } = useWBTCBalance();
  const { 
    approve, 
    isPending: approvalPending, 
    isConfirming: approvalConfirming, 
    isSuccess: approvalSuccess,
  } = useApproveWBTC();
  const { 
    deposit, 
    isPending: depositPending, 
    isConfirming: depositConfirming, 
    isSuccess: depositSuccess,
  } = useDepositCollateral();

  const handleApprove = async () => {
    if (!isConnected) {
      toast("Wallet not connected");
      return;
    }

    if (!isCorrectNetwork) {
      toast("Wrong network");
      await switchToFujiNetwork();
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast("Invalid amount");
      return;
    }

    try {
      setIsApproving(true);
      await approve(amount);
      toast("Approval initiated");
    } catch (error: any) {
      toast("Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeposit = async () => {
    if (!isConnected || !isCorrectNetwork) return;

    try {
      setIsDepositing(true);
      await deposit(amount);
      toast("Deposit initiated");
    } catch (error: any) {
      toast("Deposit failed");
    } finally {
      setIsDepositing(false);
    }
  };

  // Effects to show success toasts
  if (approvalSuccess) {
    toast("Approval successful");
  }

  if (depositSuccess) {
    toast("Deposit successful");
    // Reset the form
    setAmount('');
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Deposit WBTC Collateral</CardTitle>
        <CardDescription>
          Deposit WBTC to use as collateral for loans
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="amount">Amount (WBTC)</Label>
            <Input 
              id="amount"
              placeholder="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              disabled={isApproving || isDepositing || approvalPending || depositPending}
            />
            {!balanceLoading && (
              <p className="text-xs text-gray-500">
                Balance: {parseFloat(wbtcBalance).toFixed(8)} WBTC
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          className="w-full" 
          onClick={handleApprove}
          disabled={isApproving || approvalPending || approvalConfirming || depositPending || depositConfirming}
        >
          {isApproving || approvalPending || approvalConfirming ? "Approving..." : "1. Approve WBTC"}
        </Button>
        <Button 
          className="w-full" 
          onClick={handleDeposit}
          disabled={isDepositing || !approvalSuccess || depositPending || depositConfirming}
        >
          {isDepositing || depositPending || depositConfirming ? "Depositing..." : "2. Deposit Collateral"}
        </Button>
      </CardFooter>
    </Card>
  );
}
