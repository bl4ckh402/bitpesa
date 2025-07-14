'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Copy, 
  QrCode, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Bitcoin,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLightningDeposit } from "@/lib/hooks/useLightningDeposit";
import { useWBTCBalance } from "@/lib/hooks/useContracts";
import { useAccount } from "wagmi";
import { toast } from "sonner";

interface LightningDepositProps {
  onClose?: () => void;
  onSuccess?: (amount: string) => void;
}

export function LightningDeposit({ onClose, onSuccess }: LightningDepositProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'payment' | 'success'>('input');
  
  const {
    createLightningDeposit,
    depositData,
    isCreatingPayment,
    isWaitingForPayment,
    paymentStatus,
    error,
    clearDeposit,
    executeOnChainDeposit
  } = useLightningDeposit();

  const { balance: wbtcBalance } = useWBTCBalance(address);

  // Handle payment creation
  const handleCreatePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const result = await createLightningDeposit(amount);
      if (result) {
        setStep('payment');
        toast.success('Lightning invoice created! Please pay to continue.');
      }
    } catch (err) {
      console.error('Error creating lightning payment:', err);
      toast.error('Failed to create lightning payment');
    }
  };

  // Handle copy to clipboard
  const handleCopyInvoice = () => {
    if (depositData?.bolt11) {
      navigator.clipboard.writeText(depositData.bolt11);
      toast.success('Invoice copied to clipboard!');
    }
  };

  // Handle successful payment
  useEffect(() => {
    if (paymentStatus === 'paid' && depositData) {
      setStep('success');
      toast.success('Payment received! Executing on-chain deposit...');
      executeOnChainDeposit();
    }
  }, [paymentStatus, depositData, executeOnChainDeposit]);

  // Handle component cleanup
  const handleClose = () => {
    clearDeposit();
    onClose?.();
  };

  // Handle success completion
  const handleSuccessComplete = () => {
    onSuccess?.(amount);
    handleClose();
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
          <p className="text-muted-foreground">Please connect your wallet to use Lightning deposits.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Lightning Deposit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (WBTC)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.0001"
                  min="0"
                />
                {wbtcBalance && (
                  <p className="text-sm text-muted-foreground">
                    Balance: {wbtcBalance} WBTC
                  </p>
                )}
              </div>
              
              <Button 
                onClick={handleCreatePayment}
                disabled={isCreatingPayment || !amount || parseFloat(amount) <= 0}
                className="w-full"
              >
                {isCreatingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Create Lightning Invoice
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {step === 'payment' && depositData && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <Bitcoin className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Lightning Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Pay {amount} WBTC via Lightning Network
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Lightning Invoice:</p>
                  <div className="flex items-center gap-2">
                    {/* <code className="text-xs bg-background p-2 rounded flex-1 break-all">
                      {depositData.bolt11.substring(0, 40)}...
                    </code> */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyInvoice}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Waiting for Payment</p>
                    <p className="text-xs text-muted-foreground">
                      Invoice expires in 15 minutes
                    </p>
                  </div>
                  {isWaitingForPayment && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>
              </div>

              <Button variant="outline" onClick={handleClose} className="w-full">
                Cancel
              </Button>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="space-y-2">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-lg font-semibold">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Your Lightning payment has been received and WBTC has been deposited to your account.
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Deposited: {amount} WBTC
                </p>
              </div>

              <Button onClick={handleSuccessComplete} className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
