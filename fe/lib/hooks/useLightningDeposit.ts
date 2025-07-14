'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { lightningService, type LightningDepositResponse, type SpeedPaymentResponse } from '../services/lightning-service';
import { useDepositCollateral } from './useContracts';
import { storeTransaction, TransactionType } from '../supabase/client';
import { 
  showDepositInitiated, 
  showDepositSuccess, 
  showTransactionError,
  showTransactionInitiated,
  showTransactionSuccess,
  showTransactionFailed
} from '../utils/toast-utils';

interface UseLightningDepositReturn {
  createLightningDeposit: (amount: string) => Promise<LightningDepositResponse | null>;
  depositData: LightningDepositResponse | null;
  isCreatingPayment: boolean;
  isWaitingForPayment: boolean;
  paymentStatus: string | null;
  error: string | null;
  clearDeposit: () => void;
  executeOnChainDeposit: () => Promise<void>;
}

export function useLightningDeposit(): UseLightningDepositReturn {
  const { address } = useAccount();
  const { deposit: onChainDeposit, isPending: isOnChainPending } = useDepositCollateral();
  
  const [depositData, setDepositData] = useState<LightningDepositResponse | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const createLightningDeposit = useCallback(async (amount: string): Promise<LightningDepositResponse | null> => {
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    setIsCreatingPayment(true);
    setError(null);

    try {
      const lightningDepositData = await lightningService.createLightningDepositPayment({
        amount,
        userAddress: address,
        collateralType: 'WBTC',
        metadata: {
          deposit_amount: amount,
          timestamp: Date.now(),
        },
      });

      setDepositData(lightningDepositData);
      setPaymentStatus('unpaid');
      setIsWaitingForPayment(true);

      // Store initial transaction record
      await storeTransaction({
        user_address: address,
        transaction_type: TransactionType.COLLATERAL_DEPOSITED,
        amount,
        token_symbol: 'WBTC',
        token_decimals: 18,
        tx_hash: lightningDepositData.paymentId, // Use payment ID as temp hash
      });

      // Show toast notification
      showTransactionInitiated(
        'Lightning Deposit',
        `Creating Lightning invoice for ${amount} WBTC deposit`,
        lightningDepositData.paymentId
      );

      // Start polling for payment status
      startPaymentPolling(lightningDepositData.paymentId);

      return lightningDepositData;
    } catch (err) {
      console.error('Error creating Lightning deposit:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      showTransactionFailed('Failed to create Lightning deposit payment');
      return null;
    } finally {
      setIsCreatingPayment(false);
    }
  }, [address]);

  const startPaymentPolling = useCallback((paymentId: string) => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    const interval = setInterval(async () => {
      try {
        const payment = await lightningService.checkPaymentStatus(paymentId);
        setPaymentStatus(payment.status);

        if (payment.status === 'paid') {
          setIsWaitingForPayment(false);
          clearInterval(interval);
          setPollInterval(null);

          // Show success notification
          showTransactionSuccess(
            'Lightning Payment Received',
            `Received ${payment.target_amount_paid} sats for collateral deposit`
          );

          // Now execute the on-chain deposit
          await executeOnChainDeposit();
        } else if (payment.status === 'expired' || payment.status === 'cancelled') {
          setIsWaitingForPayment(false);
          clearInterval(interval);
          setPollInterval(null);
          setError(`Payment ${payment.status}`);
          showTransactionFailed(`Lightning payment ${payment.status}`);
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    }, 5000); // Poll every 5 seconds

    setPollInterval(interval);

    // Clear polling after 30 minutes (payment expiry)
    setTimeout(() => {
      clearInterval(interval);
      setPollInterval(null);
      setIsWaitingForPayment(false);
    }, 30 * 60 * 1000);
  }, [pollInterval]);

  const executeOnChainDeposit = useCallback(async () => {
    if (!depositData || !address) {
      setError('No deposit data available');
      return;
    }

    try {
      // Extract original WBTC amount from metadata
      const originalAmount = depositData.amount.toString(); // This would be the WBTC amount
      
      showDepositInitiated(originalAmount, 'WBTC');

      // Execute the on-chain deposit
      await onChainDeposit(originalAmount);

      showDepositSuccess(originalAmount, 'WBTC');
      
      // Clear the deposit data after successful on-chain transaction
      setTimeout(() => {
        clearDeposit();
      }, 3000);
    } catch (err) {
      console.error('Error executing on-chain deposit:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute on-chain deposit';
      setError(errorMessage);
      showTransactionFailed(errorMessage);
    }
  }, [depositData, address, onChainDeposit]);

  const clearDeposit = useCallback(() => {
    setDepositData(null);
    setPaymentStatus(null);
    setError(null);
    setIsWaitingForPayment(false);
    
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  }, [pollInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  return {
    createLightningDeposit,
    depositData,
    isCreatingPayment,
    isWaitingForPayment,
    paymentStatus,
    error,
    clearDeposit,
    executeOnChainDeposit,
  };
}
