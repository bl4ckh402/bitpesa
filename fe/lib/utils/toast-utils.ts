"use client";

import { toast } from 'sonner';
import { formatEther } from 'viem';

// Define common toast durations
export const DURATION = {
  SHORT: 3000,
  NORMAL: 5000,
  LONG: 8000,
};

// Define toast appearance types
type ToastType = 'success' | 'error' | 'info' | 'loading' | 'warning';

// Define toast configuration
interface ToastOptions {
  id?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  cancel?: {
    label: string;
    onClick: () => void;
  }
}

/**
 * Show a formatted transaction toast
 */
export const showTransactionToast = (
  type: ToastType,
  message: string,
  options?: ToastOptions
) => {
  const duration = options?.duration || 
    (type === 'success' ? DURATION.NORMAL : 
     type === 'error' ? DURATION.LONG : 
     type === 'loading' ? DURATION.LONG : 
     DURATION.NORMAL);

  switch (type) {
    case 'success':
      toast.success(message, {
        id: options?.id,
        description: options?.description,
        duration,
        action: options?.action,
      });
      break;
    case 'error':
      toast.error(message, {
        id: options?.id,
        description: options?.description,
        duration,
        action: options?.action,
      });
      break;
    case 'info':
      toast.info(message, {
        id: options?.id,
        description: options?.description,
        duration,
        action: options?.action,
      });
      break;
    case 'warning':
      toast.warning(message, {
        id: options?.id,
        description: options?.description,
        duration,
        action: options?.action,
      });
      break;
    case 'loading':
      return toast.loading(message, {
        id: options?.id,
        description: options?.description,
      });
    default:
      toast(message, {
        id: options?.id,
        description: options?.description,
        duration,
        action: options?.action,
      });
  }
};

/**
 * Show transaction initiation toast with approval info
 */
export const showTransactionInitiated = (
  txType: string,
  details?: string,
  id?: string
) => {
  return showTransactionToast(
    'loading',
    `${txType} initiated`,
    {
      id,
      description: details || 'Please confirm in your wallet',
      duration: DURATION.LONG,
    }
  );
};

/**
 * Show transaction success toast with details
 */
export const showTransactionSuccess = (
  txType: string, 
  details?: string,
  options?: ToastOptions
) => {
  showTransactionToast(
    'success',
    `${txType} successful`,
    {
      id: options?.id,
      description: details,
      action: options?.action,
      duration: options?.duration || DURATION.NORMAL,
    }
  );
};

/**
 * Show transaction failure toast with error details
 */
export const showTransactionError = (
  txType: string,
  error?: any,
  options?: ToastOptions
) => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
  const shortError = errorMessage.length > 100 
    ? errorMessage.slice(0, 100) + '...' 
    : errorMessage;
  
  showTransactionToast(
    'error',
    `${txType} failed`,
    {
      id: options?.id,
      description: shortError,
      action: options?.action,
      duration: options?.duration || DURATION.LONG,
    }
  );
};

/**
 * Show simple transaction failure toast
 */
export const showTransactionFailed = (message: string, options?: ToastOptions) => {
  showTransactionToast(
    'error',
    message,
    {
      id: options?.id,
      description: options?.description,
      duration: options?.duration || DURATION.LONG,
    }
  );
};

/**
 * Cross-chain bridge specific toasts
 */
export const showBridgeInitiated = (
  tokenSymbol: string, 
  amount: string, 
  sourceChain: string, 
  destChain: string
) => {
  const id = `bridge-${Date.now()}`;
  return showTransactionInitiated(
    'Cross-chain bridge',
    `Bridging ${amount} ${tokenSymbol} from ${sourceChain} to ${destChain}`,
    id
  );
};

export const showBridgeSuccess = (
  tokenSymbol: string, 
  amount: string, 
  destChain: string,
  txHash?: string
) => {
  showTransactionSuccess(
    'Cross-chain bridge',
    `Successfully bridged ${amount} ${tokenSymbol} to ${destChain}`,
    {
      action: txHash ? {
        label: 'View Transaction',
        onClick: () => window.open(`https://ccipscan.io/tx/${txHash}`, '_blank')
      } : undefined
    }
  );
};

/**
 * Loan specific toasts
 */
export const showLoanCreated = (amount: string, collateral: string) => {
  const id = `loan-${Date.now()}`;
  return showTransactionSuccess(
    'Loan created',
    `Loan for ${amount} USDC backed by ${collateral} WBTC has been created successfully`,
    { id, duration: DURATION.NORMAL }
  );
};

export const showLoanRepaid = (loanId: number) => {
  const id = `loan-repay-${loanId}-${Date.now()}`;
  return showTransactionSuccess(
    'Loan repaid',
    `Loan #${loanId} has been fully repaid and your collateral is released`,
    { id, duration: DURATION.NORMAL }
  );
};

export const showLoanApprovalInitiated = (amount: string) => {
  const id = `loan-approval-${Date.now()}`;
  return showTransactionInitiated(
    'Loan collateral approval',
    `Approving ${amount} WBTC for loan collateral`,
    id
  );
};

export const showLoanApprovalSuccess = (amount: string) => {
  return showTransactionSuccess(
    'Approval successful',
    `Successfully approved ${amount} WBTC for loan collateral`
  );
};

export const showLoanProcessing = (amount: string) => {
  const id = `loan-process-${Date.now()}`;
  return showTransactionInitiated(
    'Loan creation',
    `Processing loan request for ${amount} USDC`,
    id
  );
};

/**
 * Will related toasts
 */
export const showWillCreated = (beneficiary: string) => {
  const id = `will-create-${Date.now()}`;
  return showTransactionSuccess(
    'Crypto Will created',
    `Crypto Will with beneficiary ${beneficiary.slice(0, 6)}...${beneficiary.slice(-4)} created successfully`,
    { id, duration: DURATION.NORMAL }
  );
};

export const showWillActivated = () => {
  return showTransactionSuccess(
    'Will activated',
    'Your Crypto Will has been activated and is now in force'
  );
};

export const showWillApprovalInitiated = (amount: string) => {
  const id = `will-approval-${Date.now()}`;
  return showTransactionInitiated(
    'Will asset approval',
    `Approving ${amount} WBTC for your Crypto Will`,
    id
  );
};

export const showWillApprovalSuccess = (amount: string) => {
  return showTransactionSuccess(
    'Approval successful',
    `Successfully approved ${amount} WBTC for your Crypto Will`
  );
};

export const showWillCreationInitiated = (amount: string, beneficiaryCount: number) => {
  const id = `will-creation-${Date.now()}`;
  return showTransactionInitiated(
    'Creating Crypto Will',
    `Processing Crypto Will with ${amount} WBTC for ${beneficiaryCount} beneficiaries`,
    id
  );
};

export const showWillExecuted = () => {
  return showTransactionSuccess(
    'Will executed',
    'Crypto Will has been executed and assets transferred to beneficiaries',
    { duration: DURATION.LONG }
  );
};

export const showWillUpdated = () => {
  return showTransactionSuccess(
    'Will updated',
    'Your Crypto Will has been updated successfully'
  );
};

/**
 * Deposit and Withdrawal specific toasts
 */
export const showDepositInitiated = (amount: string, token: string = 'WBTC') => {
  const id = `deposit-${Date.now()}`;
  return showTransactionInitiated(
    'Deposit',
    `Depositing ${amount} ${token} as collateral`,
    id
  );
};

export const showDepositSuccess = (amount: string, token: string = 'WBTC') => {
  return showTransactionSuccess(
    'Deposit successful',
    `Successfully deposited ${amount} ${token} as collateral`
  );
};

export const showWithdrawInitiated = (amount: string, token: string = 'WBTC') => {
  const id = `withdraw-${Date.now()}`;
  return showTransactionInitiated(
    'Withdrawal',
    `Withdrawing ${amount} ${token} from collateral`,
    id
  );
};

export const showWithdrawSuccess = (amount: string, token: string = 'WBTC') => {
  return showTransactionSuccess(
    'Withdrawal successful',
    `Successfully withdrew ${amount} ${token} from collateral`
  );
};

export const showRepaymentInitiated = (amount: string, loanId?: number) => {
  const id = `repay-${loanId || Date.now()}`;
  const message = loanId 
    ? `Repaying loan #${loanId} with ${amount} USDC` 
    : `Repaying ${amount} USDC on your loan`;
  
  return showTransactionInitiated(
    'Loan repayment',
    message,
    id
  );
};

export const showInterestAccrued = (loanId: number, interestAmount: string) => {
  return toast.info(
    `Interest accrued`,
    {
      description: `Loan #${loanId} has accrued ${interestAmount} USDC in interest`,
      duration: DURATION.NORMAL
    }
  );
};

// Export default toast for simpler uses
export { toast };
