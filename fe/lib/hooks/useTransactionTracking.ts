import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Transaction, TransactionType, storeTransaction } from '../supabase/client';

export function useTransactionTracking() {
  const { address } = useAccount();

  const trackCollateralDeposit = useCallback(
    async (amount: string, txHash?: string) => {
      if (!address) return;
      
      await storeTransaction({
        user_address: address,
        transaction_type: TransactionType.COLLATERAL_DEPOSITED,
        amount,
        token_symbol: 'WBTC',
        token_decimals: 8,
        tx_hash: txHash,
        block_timestamp: Date.now(),
      });
    },
    [address]
  );

  const trackCollateralWithdrawal = useCallback(
    async (amount: string, txHash?: string) => {
      if (!address) return;
      
      await storeTransaction({
        user_address: address,
        transaction_type: TransactionType.COLLATERAL_WITHDRAWN,
        amount,
        token_symbol: 'WBTC',
        token_decimals: 8,
        tx_hash: txHash,
        block_timestamp: Date.now(),
      });
    },
    [address]
  );

  const trackLoanCreation = useCallback(
    async (loanId: number, collateralAmount: string, loanAmount: string, durationDays: number, interestRate: number, txHash?: string) => {
      if (!address) return;
      
      await storeTransaction({
        user_address: address,
        transaction_type: TransactionType.LOAN_CREATED,
        amount: loanAmount,
        token_symbol: 'USDC',
        token_decimals: 18,
        tx_hash: txHash,
        block_timestamp: Date.now(),
        loan_id: loanId,
        interest_rate: interestRate,
        loan_duration_days: durationDays,
        metadata: {
          collateral_amount: collateralAmount,
          collateral_token: 'WBTC',
        },
      });
    },
    [address]
  );

  const trackLoanRepayment = useCallback(
    async (loanId: number, repaymentAmount: string, txHash?: string) => {
      if (!address) return;
      
      await storeTransaction({
        user_address: address,
        transaction_type: TransactionType.LOAN_REPAID,
        amount: repaymentAmount,
        token_symbol: 'USDC',
        token_decimals: 18,
        tx_hash: txHash,
        block_timestamp: Date.now(),
        loan_id: loanId,
      });
    },
    [address]
  );

  return {
    trackCollateralDeposit,
    trackCollateralWithdrawal,
    trackLoanCreation,
    trackLoanRepayment,
  };
}
