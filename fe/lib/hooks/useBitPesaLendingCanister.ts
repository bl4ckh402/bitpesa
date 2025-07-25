 'use client';

import { useMemo, useState, useEffect } from 'react';
import { useICP } from './useICP';
import { idlFactory } from '../canisters/bitpesa_lending.did';
import { Principal } from '@dfinity/principal';
import { LoanId, Loan, Satoshi } from '../types/icp';
import { icpActorService } from '../services/ICPActorService';
import { withCertificateRecovery } from '../utils/icp-certificate-recovery';

// Define types based on the candid interface
type BitcoinNetwork = {
  'mainnet': null;
  'regtest': null;
  'testnet': null;
};

type AppError = {
  'AddressGenerationFailed': string;
  'InsufficientPlatformLiquidity': null;
  'CollateralLocked': null;
  'RepaymentTooLow': null;
  'InsufficientCollateral': null;
  'PriceOracleFailed': string;
  'LoanNotFound': null;
  'BitcoinError': string;
  'InsufficientBalance': null;
  'Unauthorized': null;
  'LoanExceedsCollateralRatio': null;
  'TransferFailed': string;
  'LoanNotActive': null;
  'InvalidLoanDuration': null;
};

// Define CollateralType
type CollateralType = { 'ckBTC': null } | { 'NativeBTC': null };

type PlatformStats = {
  totalLoans: bigint;
  totalCollateral: bigint;
  totalBitcoinCollateral: Satoshi;
  totalOutstanding: bigint;
  protocolFees: bigint;
};

// Result types
type Result<T> = { ok: T } | { err: AppError };

/**
 * Custom hook for interacting with the BitPesaLending canister
 */
export function useBitPesaLendingCanister() {
  const { isAuthenticated, identity, principal } = useICP();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actor, setActor] = useState<any>(null);
  
  // Create the actor when identity changes
  useEffect(() => {
    const createActor = async () => {
      if (identity) {
        try {
          const canisterId = process.env.NEXT_PUBLIC_BITPESA_LENDING_CANISTER_ID_LOCAL!;
          const newActor = await icpActorService.createActor(idlFactory, canisterId);
          setActor(newActor);
        } catch (err) {
          console.error('Failed to create BitPesaLending actor:', err);
          setActor(null);
        }
      } else {
        setActor(null);
      }
    };
    
    createActor();
  }, [identity]);

  /**
   * Helper function to handle canister calls with automatic certificate recovery
   */
  const callCanister = async <T,>(
    fn: () => Promise<T>,
    loadingMessage = 'Processing request'
  ): Promise<{ data: T | null; error: string | null }> => {
    if (!isAuthenticated || !actor) {
      return { data: null, error: 'Not authenticated' };
    }

    setIsLoading(true);
    setError(null);
    // console.log(loadingMessage);

    try {
      // Use certificate recovery wrapper for all canister calls
      const result = await withCertificateRecovery(fn, identity || undefined);
      setIsLoading(false);
      return { data: result, error: null };
    } catch (err: any) {
      console.error('Canister call failed:', err);
      setIsLoading(false);
      setError(err.message || 'An error occurred');
      return { data: null, error: err.message || 'An error occurred' };
    }
  };

  // Format error messages from Result types
  const formatErrorMessage = (error: AppError): string => {
    const errorType = Object.keys(error)[0] as keyof AppError;
    const errorValue = error[errorType as keyof AppError];
    
    if (typeof errorValue === 'string') {
      return `${errorType}: ${errorValue}`;
    }
    return errorType;
  };

  // --------------------------
  // Bitcoin Integration Methods
  // --------------------------

  /**
   * Generate a unique Bitcoin address for the authenticated user
   */
  const generateUserBitcoinAddress = async () => {
    return callCanister(async () => {
      const response = await actor!.generateUserBitcoinAddress() as Result<string>;
      if ('err' in response) {
        throw new Error(formatErrorMessage(response.err));
      }
      return response.ok;
    }, 'Generating Bitcoin address');
  };

  /**
   * Get the user's Bitcoin address
   */
  const getUserBitcoinAddress = async () => {
    return callCanister(async () => {
      return await actor!.getUserBitcoinAddress();
    }, 'Fetching Bitcoin address');
  };

  /**
   * Get the Bitcoin balance for the authenticated user
   */
  const getUserBitcoinBalance = async () => {
    return callCanister(async () => {
      const response = await actor!.getUserBitcoinBalance() as Result<Satoshi>;
      if ('err' in response) {
        throw new Error(formatErrorMessage(response.err));
      }
      return response.ok;
    }, 'Fetching Bitcoin balance');
  };

  /**
   * Deposit Bitcoin as collateral
   * User must send BTC to their address first, then call this to register the deposit
   */
  const depositBitcoinCollateral = async () => {
    return callCanister(async () => {
      const response = await actor!.depositBitcoinCollateral() as Result<Satoshi>;
      if ('err' in response) {
        throw new Error(formatErrorMessage(response.err));
      }
      return response.ok;
    }, 'Depositing Bitcoin collateral');
  };

  /**
   * Get user's Bitcoin collateral amount
   */
  const getUserBitcoinCollateral = async () => {
    return callCanister(async () => {
      return await actor!.getUserBitcoinCollateral();
    }, 'Fetching Bitcoin collateral');
  };

  // --------------------------
  // Price Oracle Methods
  // --------------------------

  /**
   * Get the current BTC/USD price
   */
  const getBtcUsdPrice = async () => {
    return callCanister(async () => {
      const response = await actor!.getBtcUsdPrice() as Result<bigint>;
      if ('err' in response) {
        throw new Error(formatErrorMessage(response.err));
      }
      return response.ok;
    }, 'Fetching BTC/USD price');
  };

  // --------------------------
  // Lending Methods
  // --------------------------

  /**
   * Create a loan using Bitcoin collateral
   */
  const createBitcoinLoan = async (loanAmount: bigint, durationDays: number) => {
    return callCanister(async () => {
      const response = await actor!.createBitcoinLoan(loanAmount, BigInt(durationDays)) as Result<LoanId>;
      if ('err' in response) {
        throw new Error(formatErrorMessage(response.err));
      }
      return response.ok;
    }, 'Creating Bitcoin loan');
  };

  /**
   * Repay a loan and release collateral
   */
  const repayLoan = async (loanId: LoanId) => {
    return callCanister(async () => {
      const response = await actor!.repayLoan(loanId) as Result<null>;
      if ('err' in response) {
        throw new Error(formatErrorMessage(response.err));
      }
      return true;
    }, 'Repaying loan');
  };

  /**
   * Withdraw Bitcoin collateral to a specified recipient address
   */
  const withdrawBitcoinCollateral = async (amount: bigint, recipientAddress: string) => {
    return callCanister(async () => {
      const response = await actor!.withdrawBitcoinCollateral(amount, recipientAddress) as Result<string>;
      if ('err' in response) {
        throw new Error(formatErrorMessage(response.err));
      }
      return response.ok;
    }, 'Withdrawing Bitcoin collateral');
  };

  // --------------------------
  // Query Methods
  // --------------------------

  /**
   * Get details of a specific loan
   */
  const getLoan = async (loanId: LoanId) => {
    return callCanister(async () => {
      return await actor!.getLoan(loanId);
    }, 'Fetching loan details');
  };

  /**
   * Get available collateral for the authenticated user
   */
  const getAvailableCollateral = async () => {
    return callCanister(async () => {
      return await actor!.getAvailableCollateral();
    }, 'Fetching available collateral');
  };

  /**
   * Get all loans for a specific user
   */
  const getUserLoans = async (userPrincipal?: Principal) => {
    const user = userPrincipal || principal;
    if (!user) {
      return { data: null, error: 'No principal provided' };
    }
    
    return callCanister(async () => {
      return await actor!.getUserLoans(user);
    }, 'Fetching user loans');
  };

  /**
   * Get platform statistics
   */
  const getPlatformStats = async () => {
    return callCanister(async () => {
      return await actor!.getPlatformStats();
    }, 'Fetching platform statistics');
  };

  // --------------------------
  // Admin Methods
  // --------------------------

  /**
   * Update the required collateral ratio (admin only)
   */
  const updateCollateralRatio = async (newRatio: bigint) => {
    return callCanister(async () => {
      await actor!.updateCollateralRatio(newRatio);
      return true;
    }, 'Updating collateral ratio');
  };

  /**
   * Set the Bitcoin network (admin only)
   */
  const setBitcoinNetwork = async (network: keyof BitcoinNetwork) => {
    return callCanister(async () => {
      await actor!.setBitcoinNetwork({ [network]: null });
      return true;
    }, 'Setting Bitcoin network');
  };

  /**
   * Withdraw accumulated fees (admin only)
   */
  const withdrawFees = async (amount: bigint) => {
    return callCanister(async () => {
      const response = await actor!.withdrawFees(amount) as Result<null>;
      if ('err' in response) {
        throw new Error(formatErrorMessage(response.err));
      }
      return true;
    }, 'Withdrawing fees');
  };

  /**
   * Update own principal (admin only)
   */
  const updateOwnPrincipal = async (principalId: Principal) => {
    return callCanister(async () => {
      await actor!.update_own_principal(principalId);
      return true;
    }, 'Updating own principal');
  };

  return {
    // State
    isLoading,
    error,
    isConnected: !!actor && isAuthenticated,
    actor,

    // Bitcoin Integration Methods
    generateUserBitcoinAddress,
    getUserBitcoinAddress,
    getUserBitcoinBalance,
    depositBitcoinCollateral,
    getUserBitcoinCollateral,
    withdrawBitcoinCollateral,

    // Price Oracle Methods
    getBtcUsdPrice,

    // Lending Methods
    createBitcoinLoan,
    repayLoan,

    // Query Methods
    getLoan,
    getAvailableCollateral,
    getUserLoans,
    getPlatformStats,

    // Admin Methods
    updateCollateralRatio,
    setBitcoinNetwork,
    withdrawFees,
    updateOwnPrincipal,
  };
}
