'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { contractAddresses, AVALANCHE_FUJI_CHAIN_ID } from '../config';
import BitPesaWillABI from '../contracts/BitPesaWill.json';
import ERC20ABI from '../contracts/ERC20.json';

// Custom hook for getting user's wills
export function useUserWills() {
  const { address } = useAccount();

  const { data: willIds, isLoading, error } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaWill as `0x${string}`,
    abi: BitPesaWillABI.abi,
    functionName: 'getWillsByUser',
    args: [address as `0x${string}`],
    chainId: AVALANCHE_FUJI_CHAIN_ID,
    query: {
      enabled: !!address
    }
  });

  return {
    willIds: willIds as number[] | undefined,
    isLoading,
    error
  };
}

// Custom hook for getting will details
export function useWillDetails(willId: number | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaWill as `0x${string}`,
    abi: BitPesaWillABI.abi,
    functionName: 'getWillDetails',
    args: [willId || 0],
    chainId: AVALANCHE_FUJI_CHAIN_ID,
    query: {
      enabled: willId !== undefined
    }
  });

  const formattedData = data ? {
    id: Number(data[0]),
    creator: data[1] as string,
    assetsAmount: formatUnits(BigInt(data[2]), 18),  // WBTC has 18 decimals
    beneficiaries: data[3] as string[],
    shares: data[4].map((share: bigint) => Number(share) / 100),  // Convert to percentages
    lastActivityTimestamp: new Date(Number(data[5]) * 1000),
    inactivityPeriod: Number(data[18]),  // Seconds
    executed: data[7] as boolean,
    metadataURI: data[8] as string
  } : undefined;

  return {
    will: formattedData,
    isLoading,
    error
  };
}

// Custom hook for checking if a will is ready for execution
export function useWillExecutionReadiness(willId: number | undefined) {
  const { data: isReady, isLoading, error } = useReadContract({
    address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaWill as `0x${string}`,
    abi: BitPesaWillABI.abi,
    functionName: 'isWillReadyForExecution',
    args: [willId || 0],
    chainId: AVALANCHE_FUJI_CHAIN_ID,
    query: {
      enabled: willId !== undefined
    }
  });

  return {
    isReady: isReady as boolean | undefined,
    isLoading,
    error
  };
}

// Custom hook for creating a will
export function useCreateWill() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createWill = async (
    assetsAmount: string,
    beneficiaries: string[],
    shares: number[],
    inactivityPeriod: number,  // In days
    metadataURI: string
  ) => {
    // Convert shares to basis points (10000 = 100%)
    const basisPointShares = shares.map(share => Math.floor(share * 100));
    
    // Convert inactivity period to seconds
    const inactivitySeconds = inactivityPeriod * 24 * 60 * 60;

    // Convert assets amount to WBTC amount (18 decimals)
    const wbtcAmount = parseUnits(assetsAmount, 18);
    
    const result = await writeContractAsync({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaWill as `0x${string}`,
      abi: BitPesaWillABI.abi,
      functionName: 'createWill',
      args: [wbtcAmount, beneficiaries, basisPointShares, inactivitySeconds, metadataURI],
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
    
    setHash(result);
    return result;
  };

  return {
    createWill,
    isPending,
    isConfirming,
    isSuccess,
    hash
  };
}

// Custom hook for updating a will
export function useUpdateWill() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const updateWill = async (
    willId: number,
    assetsAmount: string,
    metadataURI: string
  ) => {
    // Convert assets amount to WBTC amount (18 decimals)
    const wbtcAmount = parseUnits(assetsAmount, 18);
    
    const result = await writeContractAsync({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaWill as `0x${string}`,
      abi: BitPesaWillABI.abi,
      functionName: 'updateWill',
      args: [willId, wbtcAmount, metadataURI],
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
    
    setHash(result);
    return result;
  };

  return {
    updateWill,
    isPending,
    isConfirming,
    isSuccess,
    hash
  };
}

// Custom hook for updating beneficiaries
export function useUpdateBeneficiaries() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const updateBeneficiaries = async (
    willId: number,
    beneficiaries: string[],
    shares: number[]
  ) => {
    // Convert shares to basis points (10000 = 100%)
    const basisPointShares = shares.map(share => Math.floor(share * 100));
    
    const result = await writeContractAsync({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaWill as `0x${string}`,
      abi: BitPesaWillABI.abi,
      functionName: 'updateBeneficiaries',
      args: [willId, beneficiaries, basisPointShares],
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
    
    setHash(result);
    return result;
  };

  return {
    updateBeneficiaries,
    isPending,
    isConfirming,
    isSuccess,
    hash
  };
}

// Custom hook for registering activity
export function useRegisterActivity() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const registerActivity = async (willId: number) => {
    const result = await writeContractAsync({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaWill as `0x${string}`,
      abi: BitPesaWillABI.abi,
      functionName: 'registerActivity',
      args: [willId],
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
    
    setHash(result);
    return result;
  };

  return {
    registerActivity,
    isPending,
    isConfirming,
    isSuccess,
    hash
  };
}

// Custom hook for revoking a will
export function useRevokeWill() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const revokeWill = async (willId: number) => {
    const result = await writeContractAsync({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaWill as `0x${string}`,
      abi: BitPesaWillABI.abi,
      functionName: 'revokeWill',
      args: [willId],
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
    
    setHash(result);
    return result;
  };

  return {
    revokeWill,
    isPending,
    isConfirming,
    isSuccess,
    hash
  };
}

// Custom hook for executing a will
export function useExecuteWill() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const executeWill = async (willId: number) => {
    const result = await writeContractAsync({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaWill as `0x${string}`,
      abi: BitPesaWillABI.abi,
      functionName: 'executeWill',
      args: [willId],
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
    
    setHash(result);
    return result;
  };

  return {
    executeWill,
    isPending,
    isConfirming,
    isSuccess,
    hash
  };
}

// Custom hook for approving WBTC for the will contract
export function useApproveWBTCForWill() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = async (amount: string) => {
    const wbtcAmount = parseUnits(amount, 18);
    
    const result = await writeContractAsync({
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].WBTC as `0x${string}`,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaWill as `0x${string}`, wbtcAmount],
      chainId: AVALANCHE_FUJI_CHAIN_ID,
    });
    
    setHash(result);
    return result;
  };

  return {
    approve,
    isPending,
    isConfirming,
    isSuccess,
    hash
  };
}
