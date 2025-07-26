/**
 * Swypt Smart Contract Utilities
 * Helper functions for interacting with Swypt contracts across different networks
 */

import { ethers } from 'ethers';

// Smart contract addresses for different networks
export const SWYPT_CONTRACTS = {
  polygon: '0x5d3398142E393bB4BBFF6f67a3778322d3F9D90B',
  celo: '0x2816a02000B9845C464796b8c36B2D5D199525d5',
  lisk: '0x2816a02000B9845C464796b8c36B2D5D199525d5',
  base: '0x2816a02000B9845C464796b8c36B2D5D199525d5', // Assuming same as others
} as const;

// Network configurations
export const NETWORK_CONFIGS = {
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
  },
  celo: {
    chainId: 42220,
    name: 'Celo Mainnet',
    rpcUrl: 'https://forno.celo.org',
    blockExplorer: 'https://celoscan.io',
  },
  lisk: {
    chainId: 1135,
    name: 'Lisk Mainnet', 
    rpcUrl: 'https://rpc.api.lisk.com',
    blockExplorer: 'https://blockscout.lisk.com',
  },
  base: {
    chainId: 8453,
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
  },
} as const;

// Simplified ABI for the required functions
export const SWYPT_CONTRACT_ABI = [
  // withdrawToEscrow function
  {
    name: 'withdrawToEscrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'amountPlusFee', type: 'uint256' },
      { name: 'exchangeRate', type: 'uint256' },
      { name: 'feeAmount', type: 'uint256' }
    ],
    outputs: []
  },
  // withdrawWithPermit function
  {
    name: 'withdrawWithPermit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'amountPlusFee', type: 'uint256' },
      { name: 'exchangeRate', type: 'uint256' },
      { name: 'feeAmount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ],
    outputs: []
  }
] as const;

// ERC20 Token ABI (for approvals and permit)
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  },
  {
    name: 'nonces',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

export type NetworkName = keyof typeof SWYPT_CONTRACTS;

export interface WithdrawParams {
  tokenAddress: string;
  amount: string; // Amount in token units (not wei)
  exchangeRate: number;
  feeAmount: string; // Fee in token units (not wei)
  userAddress: string;
  network: NetworkName;
}

export interface PermitSignature {
  v: number;
  r: string;
  s: string;
  deadline: number;
}

/**
 * Get the Swypt contract address for a specific network
 */
export function getSwyptContractAddress(network: NetworkName): string {
  const address = SWYPT_CONTRACTS[network];
  if (!address) {
    throw new Error(`Swypt contract not available on network: ${network}`);
  }
  return address;
}

/**
 * Get network configuration
 */
export function getNetworkConfig(network: NetworkName) {
  const config = NETWORK_CONFIGS[network];
  if (!config) {
    throw new Error(`Network configuration not found: ${network}`);
  }
  return config;
}

/**
 * Create a contract instance
 */
export function createSwyptContract(
  network: NetworkName, 
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  const contractAddress = getSwyptContractAddress(network);
  return new ethers.Contract(contractAddress, SWYPT_CONTRACT_ABI, signerOrProvider);
}

/**
 * Create an ERC20 token contract instance
 */
export function createTokenContract(
  tokenAddress: string,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider);
}

/**
 * Convert amount to wei considering token decimals
 */
export async function amountToWei(
  amount: string, 
  tokenAddress: string, 
  provider: ethers.Provider
): Promise<bigint> {
  const tokenContract = createTokenContract(tokenAddress, provider);
  const decimals = await tokenContract.decimals();
  return ethers.parseUnits(amount, decimals);
}

/**
 * Convert wei to readable amount
 */
export async function weiToAmount(
  wei: bigint, 
  tokenAddress: string, 
  provider: ethers.Provider
): Promise<string> {
  const tokenContract = createTokenContract(tokenAddress, provider);
  const decimals = await tokenContract.decimals();
  return ethers.formatUnits(wei, decimals);
}

/**
 * Check if user has sufficient token balance
 */
export async function checkTokenBalance(
  userAddress: string,
  tokenAddress: string,
  requiredAmount: string,
  provider: ethers.Provider
): Promise<{ hasBalance: boolean; currentBalance: string; requiredBalance: string }> {
  const tokenContract = createTokenContract(tokenAddress, provider);
  const balance = await tokenContract.balanceOf(userAddress);
  const required = await amountToWei(requiredAmount, tokenAddress, provider);
  
  const currentBalance = await weiToAmount(balance, tokenAddress, provider);
  
  return {
    hasBalance: balance >= required,
    currentBalance,
    requiredBalance: requiredAmount
  };
}

/**
 * Check current allowance
 */
export async function checkAllowance(
  userAddress: string,
  tokenAddress: string,
  network: NetworkName,
  provider: ethers.Provider
): Promise<string> {
  const tokenContract = createTokenContract(tokenAddress, provider);
  const swyptAddress = getSwyptContractAddress(network);
  const allowance = await tokenContract.allowance(userAddress, swyptAddress);
  
  return weiToAmount(allowance, tokenAddress, provider);
}

/**
 * Approve token spending
 */
export async function approveToken(
  tokenAddress: string,
  amount: string,
  network: NetworkName,
  signer: ethers.Signer
): Promise<ethers.ContractTransactionResponse> {
  const tokenContract = createTokenContract(tokenAddress, signer);
  const swyptAddress = getSwyptContractAddress(network);
  const amountWei = await amountToWei(amount, tokenAddress, signer.provider!);
  
  return tokenContract.approve(swyptAddress, amountWei);
}

/**
 * Execute withdrawToEscrow transaction
 */
export async function withdrawToEscrow(
  params: WithdrawParams,
  signer: ethers.Signer
): Promise<ethers.ContractTransactionResponse> {
  const contract = createSwyptContract(params.network, signer);
  
  const amountWei = await amountToWei(params.amount, params.tokenAddress, signer.provider!);
  const feeWei = await amountToWei(params.feeAmount, params.tokenAddress, signer.provider!);
  const amountPlusFeeWei = amountWei + feeWei;
  
  // Convert exchange rate to appropriate format (assuming it's already in correct format)
  const exchangeRateWei = ethers.parseUnits(params.exchangeRate.toString(), 18);
  
  return contract.withdrawToEscrow(
    params.tokenAddress,
    amountPlusFeeWei,
    exchangeRateWei,
    feeWei
  );
}

/**
 * Create EIP-2612 permit signature
 */
export async function createPermitSignature(
  params: WithdrawParams & { deadline?: number },
  signer: ethers.Signer
): Promise<PermitSignature> {
  const tokenContract = createTokenContract(params.tokenAddress, signer);
  const swyptAddress = getSwyptContractAddress(params.network);
  const chainId = (await signer.provider!.getNetwork()).chainId;
  
  const amountWei = await amountToWei(params.amount, params.tokenAddress, signer.provider!);
  const feeWei = await amountToWei(params.feeAmount, params.tokenAddress, signer.provider!);
  const amountPlusFeeWei = amountWei + feeWei;
  
  const nonce = await tokenContract.nonces(params.userAddress);
  const deadline = params.deadline || Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  
  const domain = {
    name: 'Token', // This should be the actual token name
    version: '1',
    chainId: Number(chainId),
    verifyingContract: params.tokenAddress
  };
  
  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  };
  
  const permit = {
    owner: params.userAddress,
    spender: swyptAddress,
    value: amountPlusFeeWei,
    nonce,
    deadline
  };
  
  const signature = await signer.signTypedData(domain, types, permit);
  const { v, r, s } = ethers.Signature.from(signature);
  
  return {
    v,
    r,
    s,
    deadline
  };
}

/**
 * Execute withdrawWithPermit transaction
 */
export async function withdrawWithPermit(
  params: WithdrawParams,
  permitSignature: PermitSignature,
  signer: ethers.Signer
): Promise<ethers.ContractTransactionResponse> {
  const contract = createSwyptContract(params.network, signer);
  
  const amountWei = await amountToWei(params.amount, params.tokenAddress, signer.provider!);
  const feeWei = await amountToWei(params.feeAmount, params.tokenAddress, signer.provider!);
  const amountPlusFeeWei = amountWei + feeWei;
  
  // Convert exchange rate to appropriate format
  const exchangeRateWei = ethers.parseUnits(params.exchangeRate.toString(), 18);
  
  return contract.withdrawWithPermit(
    params.tokenAddress,
    amountPlusFeeWei,
    exchangeRateWei,
    feeWei,
    permitSignature.deadline,
    permitSignature.v,
    permitSignature.r,
    permitSignature.s
  );
}

/**
 * Estimate gas for withdrawal transaction
 */
export async function estimateWithdrawGas(
  params: WithdrawParams,
  usePermit: boolean = false,
  signer: ethers.Signer
): Promise<bigint> {
  const contract = createSwyptContract(params.network, signer);
  
  const amountWei = await amountToWei(params.amount, params.tokenAddress, signer.provider!);
  const feeWei = await amountToWei(params.feeAmount, params.tokenAddress, signer.provider!);
  const amountPlusFeeWei = amountWei + feeWei;
  const exchangeRateWei = ethers.parseUnits(params.exchangeRate.toString(), 18);
  
  if (usePermit) {
    const permitSignature = await createPermitSignature(params, signer);
    return contract.withdrawWithPermit.estimateGas(
      params.tokenAddress,
      amountPlusFeeWei,
      exchangeRateWei,
      feeWei,
      permitSignature.deadline,
      permitSignature.v,
      permitSignature.r,
      permitSignature.s
    );
  } else {
    return contract.withdrawToEscrow.estimateGas(
      params.tokenAddress,
      amountPlusFeeWei,
      exchangeRateWei,
      feeWei
    );
  }
}

/**
 * Get transaction receipt and extract relevant information
 */
export async function getWithdrawTransactionInfo(
  txHash: string,
  provider: ethers.Provider
): Promise<{
  success: boolean;
  blockNumber: number;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  logs: ethers.Log[];
}> {
  const receipt = await provider.getTransactionReceipt(txHash);
  
  if (!receipt) {
    throw new Error('Transaction not found');
  }
  
  return {
    success: receipt.status === 1,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
    effectiveGasPrice: receipt.gasPrice,
    logs: Array.from(receipt.logs)
  };
}
