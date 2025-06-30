'use client';

import { useMemo } from 'react';
import { useWeb3 } from '../providers/web3-provider';
import { useContract } from '../context/ContractContext';
import * as ContractHooks from './useContracts';
import { formatUnits, parseUnits } from 'viem';

export function useBitPesa() {
  const web3Context = useWeb3();
  const contractContext = useContract();
  
  // Formatting utils
  const formatWBTC = (amount: bigint | string) => formatUnits(typeof amount === 'string' ? BigInt(amount) : amount, 18);
  const formatUSDC = (amount: bigint | string) => formatUnits(typeof amount === 'string' ? BigInt(amount) : amount, 18);
  const parseWBTC = (amount: string) => parseUnits(amount, 18);
  const parseUSDC = (amount: string) => parseUnits(amount, 18);
  
  // Access to all contract read hooks
  const {
    useGetBtcUsdPrice,
    useUserCollateralBalance,
    useTotalCollateralLocked,
    useTotalLoansOutstanding,
    useLoanDetails,
    useWBTCBalance,
    useUSDCBalance,
    useRequiredCollateralRatio,
    useLoansList,

  } = ContractHooks;
  
  // Access to all contract write hooks
  const { 
    useDepositCollateral,
    useWithdrawCollateral,
    useCreateLoan,
    useRepayLoan,    
    useApproveWBTC,
    useApproveUSDC,
    useTransferTokens,
    useTransferTokensPayLink,
    useTransferTokensPayNative,
    useApproveWBTCForBridge
  } = ContractHooks;

  // Loan calculator
  const calculateMaxLoanAmount = (collateralAmount: string, collateralRatio: number, btcPrice: number) => {
    if (!collateralAmount || !collateralRatio || !btcPrice) return '0';
    
    const collateralBtcValue = parseFloat(collateralAmount);
    const collateralUsdValue = collateralBtcValue * btcPrice;
    const maxLoanAmount = collateralUsdValue * (100 / collateralRatio);
    
    return maxLoanAmount.toFixed(2);
  };
  
  // Required collateral calculator
  const calculateRequiredCollateral = (loanAmount: string, collateralRatio: number, btcPrice: number) => {
    if (!loanAmount || !collateralRatio || !btcPrice) return '0';
    
    const loanUsdValue = parseFloat(loanAmount);
    const requiredCollateralValue = (loanUsdValue * collateralRatio) / 100;
    const requiredCollateralBtc = requiredCollateralValue / btcPrice;
    
    return requiredCollateralBtc.toFixed(3);
  };

  return {
    // Connection state
    ...web3Context,
    
    // Contract state
    ...contractContext,
    
    // Utils
    formatWBTC,
    formatUSDC,
    parseWBTC,
    parseUSDC,
    
    // Calculators
    calculateMaxLoanAmount,
    calculateRequiredCollateral,
    
    // Contract hooks references - allow direct access when needed
    contractHooks: ContractHooks,
  };
}
