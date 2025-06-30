'use client';

// Export all contract hooks for easy imports
export { useBitPesa } from './hooks/useBitPesa';
export { useTokenAllowance } from './hooks/useTokenAllowance';
export { ContractProvider, useContract } from './context/ContractContext';
export { Web3Provider, useWeb3 } from './providers/web3-provider';
export { AppProviders } from './providers/AppProviders';

// Re-export contract-specific hooks
export {
  useGetBtcUsdPrice,
  useUserCollateralBalance,
  useTotalCollateralLocked,
  useTotalLoansOutstanding,
  useLoanDetails,
  useWBTCBalance,
  useUSDCBalance,
  useRequiredCollateralRatio,
  useDepositCollateral,
  useWithdrawCollateral,
  useCreateLoan,
  useRepayLoan,
  useApproveWBTC,
  useApproveUSDC,
  useCalculateInterest,  useTransferTokens,
  useTransferTokensPayLink,
  useTransferTokensPayNative,
  useLoansList
} from './hooks/useContracts';

// Export contract addresses and chain info
export { contractAddresses, AVALANCHE_FUJI_CHAIN_ID, ETHEREUM_GOERLI_CHAIN_ID } from './config';
