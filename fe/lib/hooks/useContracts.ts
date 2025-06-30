"use client";

import {
  useReadContract,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { readContract } from "@wagmi/core";
import { parseUnits, formatUnits } from "viem";
import { useState, useEffect } from "react";
import BitPesaLendingABI from "../contracts/BitPesaLending.json";
import BitPesaPriceConsumerABI from "../contracts/BitPesaPriceConsumer.json";
import BitPesaTokenBridgeABI from "../contracts/BitPesaTokenBridge.json";
import ERC20ABI from "../contracts/ERC20.json";
import { contractAddresses, AVALANCHE_FUJI_CHAIN_ID } from "../config";
import { config as wagmiConfig } from "../wagmi-appkit";
import { useTransactionTracking } from "./useTransactionTracking";

/* BitPesa Lending Contract Hooks */

// Read hooks
export function useGetBtcUsdPrice() {
  const { data, isLoading, error } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
      .BitPesaPriceConsumer as `0x${string}`,
    abi: BitPesaPriceConsumerABI.abi,
    functionName: "getLatestPrice",
    chainId: AVALANCHE_FUJI_CHAIN_ID,
  });

  // Return the formatted price in USD (18 decimals)
  return {
    price: data ? Number(formatUnits(data as bigint, 8)) : null,
    isLoading,
    error,
  };
}

export function useUserCollateralBalance(address?: string) {
  const { address: accountAddress } = useAccount();
  const userAddress = address || accountAddress;

  const { data, isLoading, error } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
      .BitPesaLending as `0x${string}`,
    abi: BitPesaLendingABI.abi,
    functionName: "userCollateralBalance",
    args: [userAddress],
    chainId: AVALANCHE_FUJI_CHAIN_ID,
    // enabled: !!userAddress,
  });

  return {
    balance: data ? formatUnits(data as bigint, 18) : "0",
    isLoading,
    error,
  };
}

export function useTotalCollateralLocked() {
  const { data, isLoading, error } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
      .BitPesaLending as `0x${string}`,
    abi: BitPesaLendingABI.abi,
    functionName: "totalCollateralLocked",
    chainId: AVALANCHE_FUJI_CHAIN_ID,
  });

  return {
    totalLocked: data ? formatUnits(data as bigint, 18) : "0",
    isLoading,
    error,
  };
}

export function useTotalLoansOutstanding() {
  const { data, isLoading, error } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
      .BitPesaLending as `0x${string}`,
    abi: BitPesaLendingABI.abi,
    functionName: "totalLoansOutstanding",
    chainId: AVALANCHE_FUJI_CHAIN_ID,
  });

  return {
    totalOutstanding: data ? formatUnits(data as bigint, 18) : "0", // Assuming USDC with 18 decimals
    isLoading,
    error,
  };
}

export function useLoanDetails(loanId: number) {
  const { data, isLoading, error } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
      .BitPesaLending as `0x${string}`,
    abi: BitPesaLendingABI.abi,
    functionName: "loans",
    args: [BigInt(loanId)],
    chainId: AVALANCHE_FUJI_CHAIN_ID,
  });

  let loanDetails = null;
  if (data) {
    const loan = data as any[];
    loanDetails = {
      id: Number(loan[0]),
      borrower: loan[1],
      collateralAmount: formatUnits(loan[2], 18),
      loanAmount: formatUnits(loan[3], 18),
      startTimestamp: Number(loan[4]),
      endTimestamp: Number(loan[5]),
      interestRate: Number(loan[6]),
      active: loan[7],
      liquidated: loan[8],
      lastInterestCalculation: Number(loan[9]),
    };
  }

  return {
    loan: loanDetails,
    isLoading,
    error,
  };
}

export function useWBTCBalance(address?: string) {
  const { address: accountAddress } = useAccount();
  const userAddress = address || accountAddress;

  const { data, isLoading, error } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].WBTC as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [userAddress as `0x${string}`],
    chainId: AVALANCHE_FUJI_CHAIN_ID,
    // enabled: !!userAddress,
  });

  return {
    balance: data ? formatUnits(data as bigint, 18) : "0",
    isLoading,
    error,
  };
}

export function useUSDCBalance(address?: string) {
  const { address: accountAddress } = useAccount();
  const userAddress = address || accountAddress;

  const { data, isLoading, error } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].USDC as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [userAddress as `0x${string}`],
    chainId: AVALANCHE_FUJI_CHAIN_ID,
    // enabled: !!userAddress,
  });

  return {
    balance: data ? formatUnits(data as bigint, 6) : "0",
    isLoading,
    error,
  };
}

export function useRequiredCollateralRatio() {
  const { data, isLoading, error } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
      .BitPesaLending as `0x${string}`,
    abi: BitPesaLendingABI.abi,
    functionName: "requiredCollateralRatio",
    chainId: AVALANCHE_FUJI_CHAIN_ID,
  });

  return {
    ratio: data ? Number(data) : 0,
    isLoading,
    error,
  };
}

// Write hooks
export function useDepositCollateral() {
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { trackCollateralDeposit } = useTransactionTracking();

  const deposit = async (amount: string) => {
    const wbtcAmount = parseUnits(amount, 18);

    try {
      await writeContract({
        address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
          .BitPesaLending as `0x${string}`,
        abi: BitPesaLendingABI.abi,
        functionName: "deposit",
        args: [wbtcAmount],
        chainId: AVALANCHE_FUJI_CHAIN_ID,
      });

      // Track the deposit transaction in Supabase
      await trackCollateralDeposit(amount, hash?.toString());
    } catch (err) {
      console.error("Deposit error:", err);
      throw err;
    }
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useWithdrawCollateral() {
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { trackCollateralWithdrawal } = useTransactionTracking();

  const withdraw = async (amount: string) => {
    const wbtcAmount = parseUnits(amount, 18);

    try {
      await writeContract({
        address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
          .BitPesaLending as `0x${string}`,
        abi: BitPesaLendingABI.abi,
        functionName: "withdraw",
        args: [wbtcAmount],
        chainId: AVALANCHE_FUJI_CHAIN_ID,
      });

      // Track the withdrawal transaction in Supabase
      await trackCollateralWithdrawal(amount, hash?.toString());
    } catch (err) {
      console.error("Withdrawal error:", err);
      throw err;
    }
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCreateLoan() {
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { trackLoanCreation } = useTransactionTracking();
  const { data: requiredCollateralRatioData } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
      .BitPesaLending as `0x${string}`,
    abi: BitPesaLendingABI.abi,
    functionName: "requiredCollateralRatio",
    chainId: AVALANCHE_FUJI_CHAIN_ID,
  });

  const createLoan = async (
    collateralAmount: string,
    loanAmount: string,
    durationDays: number
  ) => {
    const wbtcAmount = parseUnits(collateralAmount, 18);
    const usdcAmount = parseUnits(loanAmount, 18);

    try {
      await writeContract({
        address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
          .BitPesaLending as `0x${string}`,
        abi: BitPesaLendingABI.abi,
        functionName: "createLoan",
        args: [wbtcAmount, usdcAmount, BigInt(durationDays)],
        chainId: AVALANCHE_FUJI_CHAIN_ID,
      });

      // Get the current loan ID (we'll use the hash as a unique identifier for now)
      // In a production environment, you might want to get the actual loan ID by listening to events
      const interestRate = 5; // Default interest rate - ideally get this from contract

      // Track the loan creation in Supabase
      await trackLoanCreation(
        Date.now(), // Temporary ID until we get the actual loan ID
        collateralAmount,
        loanAmount,
        durationDays,
        interestRate,
        hash?.toString()
      );
    } catch (err) {
      console.error("Create loan error:", err);
      throw err;
    }
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    createLoan,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useRepayLoan() {
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { trackLoanRepayment } = useTransactionTracking();

  const repayLoan = async (loanId: number, repaymentAmount: string) => {
    const usdcAmount = parseUnits(repaymentAmount, 18);

    try {
      await writeContract({
        address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
          .BitPesaLending as `0x${string}`,
        abi: BitPesaLendingABI.abi,
        functionName: "repayLoan",
        args: [BigInt(loanId), usdcAmount],
        chainId: AVALANCHE_FUJI_CHAIN_ID,
      });

      // Track the loan repayment in Supabase
      await trackLoanRepayment(loanId, repaymentAmount, hash?.toString());
    } catch (err) {
      console.error("Loan repayment error:", err);
      throw err;
    }
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    repayLoan,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useApproveWBTC() {
  const { data: hash, isPending, writeContract, error } = useWriteContract();

  const approve = async (amount: string) => {
    const wbtcAmount = parseUnits(amount, 18);

    return writeContract({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].WBTC as `0x${string}`,
      abi: ERC20ABI,
      functionName: "approve",
      args: [
        contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
          .BitPesaLending as `0x${string}`,
        wbtcAmount,
      ],
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useApproveUSDC() {
  const { data: hash, isPending, writeContract, error } = useWriteContract();

  const approve = async (amount: string) => {
    const usdcAmount = parseUnits(amount, 18);

    return writeContract({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].USDC as `0x${string}`,
      abi: ERC20ABI,
      functionName: "approve",
      args: [
        contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
          .BitPesaLending as `0x${string}`,
        usdcAmount,
      ],
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCalculateInterest(loanId: number) {
  const { data, isLoading, error } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
      .BitPesaLending as `0x${string}`,
    abi: BitPesaLendingABI.abi,
    functionName: "calculateInterest",
    args: [BigInt(loanId)],
    chainId: AVALANCHE_FUJI_CHAIN_ID,
  });

  return {
    interest: data ? formatUnits(data as bigint, 18) : "0",
    isLoading,
    error,
  };
}

/* BitPesa Token Bridge Hooks */
export function useTransferTokens() {
  const { data: hash, isPending, writeContract, error } = useWriteContract();

  const transferTokens = async (
    destinationChainSelector: bigint,
    receiver: string,
    amount: string
  ) => {
    const wbtcAmount = parseUnits(amount, 18);

    return writeContract({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
        .BitPesaTokenBridge as `0x${string}`,
      abi: BitPesaTokenBridgeABI.abi,
      functionName: "transferTokens",
      args: [
        destinationChainSelector,
        receiver as `0x${string}`,
        contractAddresses[AVALANCHE_FUJI_CHAIN_ID].WBTC as `0x${string}`,
        wbtcAmount,
      ],
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    transferTokens,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useTransferTokensPayLink() {
  const { data: hash, isPending, writeContract, error } = useWriteContract();

  const transferTokens = async (
    destinationChainSelector: bigint,
    receiver: string,
    amount: string
  ) => {
    const wbtcAmount = parseUnits(amount, 18);

    return writeContract({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
        .BitPesaTokenBridge as `0x${string}`,
      abi: BitPesaTokenBridgeABI.abi,
      functionName: "transferTokensPayLink",
      args: [
        destinationChainSelector,
        receiver as `0x${string}`,
        contractAddresses[AVALANCHE_FUJI_CHAIN_ID].WBTC as `0x${string}`,
        wbtcAmount,
      ],
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    transferTokens,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useTransferTokensPayNative() {
  const { data: hash, isPending, writeContract, error } = useWriteContract();

  const transferTokens = async (
    destinationChainSelector: bigint,
    receiver: string,
    amount: string
  ) => {
    const wbtcAmount = parseUnits(amount, 18);

    return writeContract({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
        .BitPesaTokenBridge as `0x${string}`,
      abi: BitPesaTokenBridgeABI.abi,
      functionName: "transferTokensPayNative",
      args: [
        destinationChainSelector,
        receiver as `0x${string}`,
        contractAddresses[AVALANCHE_FUJI_CHAIN_ID].WBTC as `0x${string}`,
        wbtcAmount,
      ],
      value: parseUnits("0.01", 18), // Adding some native token to cover the CCIP fees (0.01 ETH/AVAX)
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    transferTokens,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useLoansList(address?: string) {
  const { address: accountAddress } = useAccount();
  const userAddress = address || accountAddress;
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Get the total number of loans (nextLoanId)
  const {
    data: nextLoanIdData,
    isLoading: isNextLoanIdLoading,
    error: nextLoanIdError,
  } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
      .BitPesaLending as `0x${string}`,
    abi: BitPesaLendingABI.abi,
    functionName: "nextLoanId",
    chainId: AVALANCHE_FUJI_CHAIN_ID,
  });

  useEffect(() => {
    // Exit early if we don't have the nextLoanId yet or the user address
    if (isNextLoanIdLoading || nextLoanIdError || !userAddress) {
      return;
    }

    const nextLoanId = Number(nextLoanIdData || 0);

    // No loans to fetch
    if (nextLoanId === 0) {
      setLoans([]);
      setIsLoading(false);
      return;
    }

    const fetchLoans = async () => {
      try {
        setIsLoading(true);

        // Create an array of loan IDs from 0 to nextLoanId-1
        const loanIds = Array.from({ length: nextLoanId }, (_, i) => i); // Create an array of promises to fetch each loan
        const loanPromises = loanIds.map((id) =>
          readContract(wagmiConfig, {
            address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID]
              .BitPesaLending as `0x${string}`,
            abi: BitPesaLendingABI.abi,
            functionName: "loans",
            args: [BigInt(id)],
            chainId: AVALANCHE_FUJI_CHAIN_ID,
          })
        );

        // Wait for all loan fetches to complete
        const loanResults = await Promise.all(loanPromises);

        // Format the loan data and filter for the user's loans
        const userLoans = loanResults
          .map((data, index) => {
            if (!data) return null;

            // Destructure the loan details from the result
            // Note: This assumes the contract returns a structure with these fields in this order
            const [
              id,
              borrower,
              collateralAmount,
              loanAmount,
              startTimestamp,
              endTimestamp,
              interestRate,
              active,
              liquidated,
              lastInterestCalculation,
            ] = data as any[];

            return {
              id: Number(id),
              borrower,
              collateralAmount: formatUnits(collateralAmount, 18), // WBTC has 18 decimals
              loanAmount: formatUnits(loanAmount, 18), // USDC has 18 decimals
              startTimestamp: Number(startTimestamp),
              endTimestamp: Number(endTimestamp),
              interestRate: Number(interestRate),
              active,
              liquidated,
              lastInterestCalculation: Number(lastInterestCalculation),
            };
          })
          .filter(
            (loan) =>
              loan !== null &&
              loan.borrower.toLowerCase() === userAddress?.toLowerCase()
          );

        setLoans(userLoans);
        setError(null);
      } catch (err) {
        console.error("Error fetching loans:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, [nextLoanIdData, isNextLoanIdLoading, nextLoanIdError, userAddress]);

  return {
    loans,
    isLoading: isLoading || isNextLoanIdLoading,
    error: error || nextLoanIdError,
  };
}

export function useApproveWBTCForBridge() {
  const { data: hash, isPending, writeContract, error } = useWriteContract();

  const approve = async (amount: string) => {
    const wbtcAmount = parseUnits(amount, 18);
    
    return writeContract({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].WBTC as `0x${string}`,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaTokenBridge as `0x${string}`, wbtcAmount],
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
