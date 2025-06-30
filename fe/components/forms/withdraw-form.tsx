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
import { 
  useUserCollateralBalance, 
  useWithdrawCollateral 
} from '@/lib/hooks/useContracts';

export default function WithdrawForm() {
  const { isConnected, isCorrectNetwork, switchToFujiNetwork } = useWeb3();
  const [amount, setAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { 
    balance: collateralBalance, 
    isLoading: balanceLoading 
  } = useUserCollateralBalance();
  
  const { 
    withdraw, 
    isPending: withdrawPending, 
    isConfirming: withdrawConfirming, 
    isSuccess: withdrawSuccess,
  } = useWithdrawCollateral();

  const handleWithdraw = async () => {
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

    if (Number(amount) > Number(collateralBalance)) {
      toast("Insufficient balance");
      return;
    }

    try {
      setIsWithdrawing(true);
      await withdraw(amount);
      toast("Withdrawal initiated");
    } catch (error: any) {
      toast("Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Effects to show success toasts
  if (withdrawSuccess) {
    toast("Withdrawal successful");
    // Reset the form
    setAmount('');
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Withdraw WBTC Collateral</CardTitle>
        <CardDescription>
          Withdraw your available WBTC collateral
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
              disabled={isWithdrawing || withdrawPending || withdrawConfirming}
            />
            {!balanceLoading && (
              <p className="text-xs text-gray-500">
                Available collateral: {parseFloat(collateralBalance).toFixed(8)} WBTC
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          className="w-full" 
          onClick={handleWithdraw}
          disabled={isWithdrawing || withdrawPending || withdrawConfirming}
        >
          {isWithdrawing || withdrawPending || withdrawConfirming ? "Withdrawing..." : "Withdraw Collateral"}
        </Button>
      </CardFooter>
    </Card>
  );
}
