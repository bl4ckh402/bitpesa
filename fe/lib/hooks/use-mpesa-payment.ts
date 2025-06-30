import { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/lib/supabase/client';

interface UseMpesaPaymentOptions {
  transactionId?: string;
  loanId?: number;
}

interface MpesaPaymentState {
  loading: boolean;
  error: string | null;
  disbursementInitiated: boolean;
  disbursementCompleted: boolean;
  disbursementFailed: boolean;
  mpesaTransactions: Transaction[];
  mpesaTransactionId?: string;
  phoneNumber?: string;
}

// Hook for integrating M-Pesa payment functionality
export function useMpesaPayment({ transactionId, loanId }: UseMpesaPaymentOptions) {
  const [state, setState] = useState<MpesaPaymentState>({
    loading: false,
    error: null,
    disbursementInitiated: false,
    disbursementCompleted: false,
    disbursementFailed: false,
    mpesaTransactions: [],
  });

  // Function to check M-Pesa transaction status
  const checkMpesaStatus = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Build query parameters
      let queryParams = '';
      if (loanId) {
        queryParams = `loanId=${loanId}`;
      } else if (transactionId) {
        queryParams = `transactionId=${transactionId}`;
      } else {
        throw new Error('Either loanId or transactionId must be provided');
      }
      
      // Fetch transaction status
      const response = await fetch(`/api/mpesa/status?${queryParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch M-Pesa status');
      }
      
      // Process transactions
      const transactions = loanId ? (data.transactions || []) : (data.transaction ? [data.transaction] : []);
      
      // Analyze transaction status
      const initiated = transactions.some((tx:any) => 
        tx.transaction_type === TransactionType.MPESA_DISBURSEMENT_INITIATED
      );
      
      const completed = transactions.some((tx:any) => 
        tx.transaction_type === TransactionType.MPESA_DISBURSEMENT_COMPLETED
      );
      
      const failed = transactions.some((tx:any) => 
        tx.transaction_type === TransactionType.MPESA_DISBURSEMENT_FAILED
      );

      // Find M-Pesa transaction ID and phone number
      let mpesaTransactionId: string | undefined;
      let phoneNumber: string | undefined;

      for (const tx of transactions) {
        if (tx.metadata?.mpesa_transaction_id) {
          mpesaTransactionId = tx.metadata.mpesa_transaction_id;
        }
        
        if (tx.metadata?.phone_number) {
          phoneNumber = tx.metadata.phone_number;
        }
      }
      
      setState({
        loading: false,
        error: null,
        disbursementInitiated: initiated,
        disbursementCompleted: completed,
        disbursementFailed: failed,
        mpesaTransactions: transactions,
        mpesaTransactionId,
        phoneNumber,
      });
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error checking M-Pesa status';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }));
      
      console.error('Error checking M-Pesa status:', error);
    }
  };

  // Function to initiate M-Pesa disbursement
  const initiateMpesaDisbursement = async (phoneNumber: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Call the API endpoint
      const response = await fetch('/api/mpesa/disburse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          phoneNumber,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process M-Pesa disbursement');
      }
      
      // Refresh status
      await checkMpesaStatus();
      
      return true;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error initiating M-Pesa disbursement';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }));
      
      console.error('Error initiating M-Pesa disbursement:', error);
      return false;
    }
  };

  // Check status on mount
  useEffect(() => {
    if (transactionId || loanId) {
      checkMpesaStatus();
    }
  }, [transactionId, loanId]);

  return {
    ...state,
    refresh: checkMpesaStatus,
    initiateDisbursement: initiateMpesaDisbursement,
  };
}
