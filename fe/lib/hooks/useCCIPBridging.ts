"use client";

import { useState } from 'react';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'sonner';

import { 
  useTransferTokens, 
  useTransferTokensPayLink, 
  useTransferTokensPayNative, 
  useApproveWBTCForBridge 
} from './useContracts';

import { CHAIN_SELECTORS, TOKEN_ADDRESSES } from '@/lib/constants/chains';

// Define types
export type BridgeMethod = 'default' | 'payLink' | 'payNative';

export type ChainName = 'AVALANCHE_FUJI' | 'SEPOLIA' | 'BASE_SEPOLIA';

// Type for the keys in CHAIN_SELECTORS
export type ChainSelectorKey = 'AVALANCHE_FUJI' | 'ETHEREUM_SEPOLIA' | 'BASE_SEPOLIA';

export type BridgingState = {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
};

export type BridgingFees = {
  gasLimit: string;
  baseFee: number;
  totalFee: number;
};

export type TokenInfo = {
  chainId: number;
  address: string;
  symbol: string;
  decimals: number;
};

export interface BridgeTransactionResult {
  txHash: string | null;
  success: boolean;
  error?: string;
}

/**
 * Custom hook for interacting with BitPesa's CCIP token bridging functionality
 * Provides a unified interface for all bridging methods (default, payLink, payNative)
 * Handles token approvals and transaction state management
 * @returns Object containing bridging functions and state
 */
export function useCCIPBridging() {
  // States
  const [bridgingState, setBridgingState] = useState<BridgingState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null
  });
  
  const [bridgingFees, setBridgingFees] = useState<BridgingFees>({
    gasLimit: "0",
    baseFee: 0,
    totalFee: 0
  });

  // Get the different bridging methods from useContracts
  const {
    transferTokens: transferDefault,
    isPending: isPendingDefault,
    isConfirming: isConfirmingDefault,
    isSuccess: isSuccessDefault,
    hash: hashDefault,
    error: errorDefault
  } = useTransferTokens();

  const {
    transferTokens: transferPayLink,
    isPending: isPendingLink,
    isConfirming: isConfirmingLink,
    isSuccess: isSuccessLink,
    hash: hashLink,
    error: errorLink
  } = useTransferTokensPayLink();

  const {
    transferTokens: transferPayNative,
    isPending: isPendingNative,
    isConfirming: isConfirmingNative,
    isSuccess: isSuccessNative,
    hash: hashNative,
    error: errorNative
  } = useTransferTokensPayNative();

  const { 
    approve, 
    isPending: isApprovePending, 
    isSuccess: isApproveSuccess,
    error: approveError
  } = useApproveWBTCForBridge();

  /**
   * Estimate fees for a cross-chain token transfer
   * @param sourceChain Source chain name (e.g., 'AVALANCHE_FUJI')
   * @param destinationChain Destination chain name (e.g., 'SEPOLIA')
   * @param tokenSymbol Token symbol (e.g., 'WBTC')
   * @param amount Amount to transfer as number (e.g., 0.01)
   * @param method Bridge method to use
   * @returns Estimated fees or null if estimation fails
   */
const estimateFees = async (
    sourceChain: ChainName, 
    destinationChain: ChainName, 
    tokenSymbol: string, 
    amount: number,
    method: BridgeMethod = 'default'
): Promise<BridgingFees | null> => {
    try {
        // Map ChainName to CHAIN_SELECTORS keys
        const getChainSelectorKey = (chain: ChainName): keyof typeof CHAIN_SELECTORS => {
            switch (chain) {
                case 'AVALANCHE_FUJI': return 'AVALANCHE_FUJI';
                case 'SEPOLIA': return 'ETHEREUM_SEPOLIA';
                case 'BASE_SEPOLIA': return 'BASE_SEPOLIA';
                // Add mappings for other chains as needed
                default:
                    throw new Error(`Chain ${chain} not supported for chain selectors`);
            }
        };
        
        // Get destination chain selector
        const selectorKey = getChainSelectorKey(destinationChain);
        const destinationChainSelector = BigInt(CHAIN_SELECTORS[selectorKey]);
        
        // Map ChainName to TOKEN_ADDRESSES keys
        const getTokenAddressKey = (chain: ChainName): keyof typeof TOKEN_ADDRESSES => {
            switch (chain) {
                case 'AVALANCHE_FUJI': return 'AVALANCHE_FUJI';
                case 'SEPOLIA': return 'SEPOLIA';
                case 'BASE_SEPOLIA': return 'BASE_SEPOLIA';
                // Add mappings for other chains as needed
                default:
                    throw new Error(`Chain ${chain} not supported for token addresses`);
            }
        };
        
        // Get token address from token symbol using the mapping
        const tokenAddressKey = getTokenAddressKey(sourceChain);
        const tokenAddress = TOKEN_ADDRESSES[tokenAddressKey]?.[tokenSymbol as keyof (typeof TOKEN_ADDRESSES)[typeof tokenAddressKey]];
        if (!tokenAddress) {
            throw new Error(`Token ${tokenSymbol} not supported on ${sourceChain}`);
        }
        
        // Convert amount to proper units (assuming 8 decimals for WBTC)
        const decimals = tokenSymbol === 'WBTC' ? 8 : 18;
        const amountStr = amount.toString();
        const amountInBaseUnits = parseUnits(amountStr, decimals);
        
        // Simulate fee estimation based on method
        // In a real implementation, you would use contract.estimateGas or a similar method
        // to get actual fee estimates from the blockchain
        
        // For now, we'll use placeholder values
        const gasLimit = BigInt(300000); // Default gas limit
        let baseFee: bigint;
        let totalFee: bigint;
        
        // These values should be retrieved from actual contract calls in production
        if (method === 'payLink') {
            // Simulated LINK fee (this should be calculated based on actual contract data)
            baseFee = parseUnits("0.02", 18); // Example LINK fee
            totalFee = baseFee;
        } else if (method === 'payNative') {
            // Simulated native token fee
            baseFee = parseUnits("0.01", 18); // Example native fee
            totalFee = baseFee;
        } else {
            // Default method fee
            baseFee = parseUnits("0.015", 18); // Example default fee
            totalFee = baseFee;
        }
        
        // Format fees to readable values
        const estimatedFees: BridgingFees = {
            gasLimit: gasLimit.toString(),
            baseFee: Number(formatUnits(baseFee, 18)),
            totalFee: Number(formatUnits(totalFee, 18))
        };
        
        setBridgingFees(estimatedFees);
        return estimatedFees;
    } catch (error) {
        console.error("Error estimating fees:", error);
        toast.error("Failed to estimate bridging fees", {
            description: (error as Error).message || "Unknown error occurred"
        });
        return null;
    }
};

  /**
   * Approves token spending for the bridge contract
   * @param tokenSymbol The token symbol to approve
   * @param amount Amount of tokens to approve (as a string)
   * @returns Promise resolving to approval transaction result
   */
  const approveTokens = async (
    tokenSymbol: string,
    amount: string
  ): Promise<BridgeTransactionResult> => {
    try {
      setBridgingState({
        isLoading: true,
        isSuccess: false,
        isError: false,
        error: null
      });

      await approve(amount);
      
      setBridgingState({
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      });
      
      return {
        txHash: null, // The approve function doesn't return a transaction hash
        success: true
      };
    } catch (error) {
      const errorMessage = (error as Error).message || "Failed to approve tokens";
      
      setBridgingState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: errorMessage
      });
      
      toast.error("Failed to approve tokens", {
        description: errorMessage
      });
      
      return {
        txHash: null,
        success: false,
        error: errorMessage
      };
    }
  };

  /**
   * Bridge tokens from one chain to another using the specified method
   * @param sourceChain Source chain name (e.g., 'AVALANCHE_FUJI')
   * @param destinationChain Destination chain name (e.g., 'SEPOLIA')
   * @param tokenSymbol Token symbol to bridge (e.g., 'WBTC')
   * @param amount Amount of tokens to transfer
   * @param receiver Receiver address on destination chain
   * @param method Bridging method to use (default, payLink, payNative)
   * @returns Promise resolving to bridging transaction result
   */
  const bridgeTokens = async (
    sourceChain: ChainName,
    destinationChain: ChainName,
    tokenSymbol: string,
    amount: string,
    receiver: string,
    method: BridgeMethod = 'default'
  ): Promise<BridgeTransactionResult> => {
    try {
      setBridgingState({
        isLoading: true,
        isSuccess: false,
        isError: false,
        error: null
      });

      // Map ChainName to CHAIN_SELECTORS key
      const getChainSelectorKey = (chain: ChainName): keyof typeof CHAIN_SELECTORS => {
        switch (chain) {
            case 'AVALANCHE_FUJI': return 'AVALANCHE_FUJI';
            case 'SEPOLIA': return 'ETHEREUM_SEPOLIA';
            case 'BASE_SEPOLIA': return 'BASE_SEPOLIA';
            // Add mappings for other chains as needed
            default:
                throw new Error(`Chain ${chain} not supported for chain selectors`);
        }
      };
      
      // Get destination chain selector
      const selectorKey = getChainSelectorKey(destinationChain);
      const destinationChainSelector = BigInt(CHAIN_SELECTORS[selectorKey]);
      
      // Execute the bridge transaction based on the selected method
      if (method === 'payLink') {
        await transferPayLink(destinationChainSelector, receiver, amount);
      } else if (method === 'payNative') {
        await transferPayNative(destinationChainSelector, receiver, amount);
      } else {
        // Default method
        await transferDefault(destinationChainSelector, receiver, amount);
      }
      
      // Get the transaction hash based on the method used
      const txHash = method === 'payLink' ? hashLink : 
                     method === 'payNative' ? hashNative : 
                     hashDefault;
      
      if (!txHash) {
        throw new Error("Transaction failed - no hash returned");
      }
      
      toast.success("Bridge transaction submitted", {
        description: `Bridging ${amount} ${tokenSymbol} to ${destinationChain}`
      });
      
      setBridgingState({
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      });
      
      return {
        txHash: txHash,
        success: true
      };
    } catch (error) {
      const errorMessage = (error as Error).message || "Failed to bridge tokens";
      
      setBridgingState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: errorMessage
      });
      
      toast.error("Bridge transaction failed", {
        description: errorMessage
      });
      
      return {
        txHash: null,
        success: false,
        error: errorMessage
      };
    }
  };

  /**
   * Get the current CCIP bridging state
   * @returns Combined bridging state from all methods
   */
  const getBridgingState = () => {
    return {
      isLoading: 
        isPendingDefault || isConfirmingDefault || 
        isPendingLink || isConfirmingLink || 
        isPendingNative || isConfirmingNative ||
        isApprovePending,
      isSuccess: 
        isSuccessDefault || isSuccessLink || isSuccessNative || isApproveSuccess,
      isError: 
        !!errorDefault || !!errorLink || !!errorNative || !!approveError,
      error: errorDefault?.message || errorLink?.message || errorNative?.message || approveError?.message || null
    };
  };

  /**
   * Get transaction hash based on the method used
   * @param method Bridge method that was used
   * @returns Transaction hash if available
   */
  const getTransactionHash = (method: BridgeMethod = 'default'): string | undefined => {
    if (method === 'payLink') {
      return hashLink;
    } else if (method === 'payNative') {
      return hashNative;
    } else {
      return hashDefault;
    }
  };

  /**
   * Get supported chains for bridging
   * @returns Array of supported chain names
   */
  const getSupportedChains = (): ChainName[] => {
    return ['AVALANCHE_FUJI', 'SEPOLIA', 'BASE_SEPOLIA'];
  };

  /**
   * Get supported tokens for a specific chain
   * @param chainName Chain to get tokens for
   * @returns Object containing token addresses mapped by symbol
   */
  const getSupportedTokens = (chainName: ChainName) => {
    const getTokenAddressKey = (chain: ChainName): keyof typeof TOKEN_ADDRESSES => {
      switch (chain) {
        case 'AVALANCHE_FUJI': return 'AVALANCHE_FUJI';
        case 'SEPOLIA': return 'SEPOLIA';
        case 'BASE_SEPOLIA': return 'BASE_SEPOLIA';
        default:
          throw new Error(`Chain ${chain} not supported for token addresses`);
      }
    };
    
    try {
      const addressKey = getTokenAddressKey(chainName);
      return TOKEN_ADDRESSES[addressKey] || {};
    } catch {
      return {};
    }
  };

  return {
    bridgingState: {
      ...bridgingState,
      ...getBridgingState()
    },
    bridgingFees,
    estimateFees,
    approveTokens,
    bridgeTokens,
    getTransactionHash,
    getSupportedChains,
    getSupportedTokens,
    isPending: isPendingDefault || isPendingLink || isPendingNative || isApprovePending,
    isConfirming: isConfirmingDefault || isConfirmingLink || isConfirmingNative,
    isSuccess: isSuccessDefault || isSuccessLink || isSuccessNative || isApproveSuccess,
  };
}
