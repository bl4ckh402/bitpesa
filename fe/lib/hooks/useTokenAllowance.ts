'use client';

import { useReadContract } from 'wagmi';
import { contractAddresses, AVALANCHE_FUJI_CHAIN_ID } from '../config';

// Import ERC20 ABI
const ERC20ABI = [
  {
    "constant": true,
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

export function useTokenAllowance(tokenType: 'WBTC' | 'USDC', owner?: string, spender?: string) {
  const tokenAddress = contractAddresses[AVALANCHE_FUJI_CHAIN_ID][tokenType] as `0x${string}`;
  const spenderAddress = spender || 
    (tokenType === 'WBTC' 
      ? contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaLending
      : contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaLending);  const { data, isLoading, error } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: owner && spenderAddress ? [owner as `0x${string}`, spenderAddress as `0x${string}`] : undefined,
    chainId: AVALANCHE_FUJI_CHAIN_ID,
    query: { 
      enabled: !!owner && !!spenderAddress 
    },
  });
  
  // Explicitly cast data as bigint
  const allowanceValue = data as bigint | undefined;
    return {
    allowance: allowanceValue || BigInt(0),
    isLoading,
    error,
    hasAllowance: (amount: bigint) => {
      console.log(`Checking allowance for ${tokenType} from ${owner} to ${spenderAddress}`);
      if (!allowanceValue) return false;
      console.log(`Allowance: ${allowanceValue}, Amount: ${amount}`);
      return allowanceValue >= amount;
    },
  };
}
