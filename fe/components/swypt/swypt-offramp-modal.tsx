'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SwyptOfframpCard } from './swypt-offramp-card';

interface SwyptOfframpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress?: string;
  loanAmount?: string;
  loanId?: string;
  defaultNetwork?: string;
  defaultToken?: string;
}

export function SwyptOfframpModal({
  isOpen,
  onClose,
  userAddress,
  loanAmount,
  loanId,
  defaultNetwork = 'celo',
  defaultToken = 'USDT'
}: SwyptOfframpModalProps) {
  const handleSuccess = (data: any) => {
    console.log('Swypt offramp successful:', data);
    // You can add additional success handling here
    // For example, update the UI, send analytics, etc.
  };

  const handleError = (error: string) => {
    console.error('Swypt offramp error:', error);
    // You can add additional error handling here
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Convert to M-Pesa
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            {loanAmount && loanId ? (
              <>Your loan has been successfully disbursed! Convert your funds to Kenyan Shillings via M-Pesa.</>
            ) : (
              <>Convert your crypto to Kenyan Shillings and receive funds directly to your M-Pesa account.</>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <SwyptOfframpCard
            userAddress={userAddress}
            onSuccess={handleSuccess}
            onError={handleError}
            defaultNetwork={defaultNetwork}
            defaultToken={defaultToken}
            defaultAmount={loanAmount}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
