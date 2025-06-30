'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useGetBtcUsdPrice, useUserCollateralBalance, useLoansList } from '../hooks/useContracts';
import { AVALANCHE_FUJI_CHAIN_ID } from '../config';

type ContractContextType = {
  // State data
  btcPrice: number | null;
  isLoadingBtcPrice: boolean;
  userCollateral: string | null;
  isLoadingUserCollateral: boolean;
  userLoans: any[] | null;
  isLoadingUserLoans: boolean;
  // Connection state
  isConnected: boolean;
  address: string | undefined;
  isCorrectNetwork: boolean;
  chainId: number | undefined;
};

const ContractContext = createContext<ContractContextType>({
  btcPrice: null,
  isLoadingBtcPrice: false,
  userCollateral: null,
  isLoadingUserCollateral: false,
  userLoans: null,
  isLoadingUserLoans: false,
  isConnected: false,
  address: undefined,
  isCorrectNetwork: false,
  chainId: undefined,
});

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, address, chain } = useAccount();
  const chainId = chain?.id;

  // Get Bitcoin price
  const { price: btcPrice, isLoading: isLoadingBtcPrice } = useGetBtcUsdPrice();

  // Get user's collateral balance
  const { balance: userCollateral, isLoading: isLoadingUserCollateral } = useUserCollateralBalance(address);

  // Get user's loans
  const { loans: userLoans, isLoading: isLoadingUserLoans } = useLoansList(address);

  // Check if user is connected to the correct network (Avalanche Fuji)
  const isCorrectNetwork = useMemo(() => {
    return chainId === AVALANCHE_FUJI_CHAIN_ID;
  }, [chainId]);

  const value = {
    btcPrice,
    isLoadingBtcPrice,
    userCollateral,
    isLoadingUserCollateral,
    userLoans,
    isLoadingUserLoans,
    isConnected,
    address,
    isCorrectNetwork,
    chainId,
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  return useContext(ContractContext);
};
