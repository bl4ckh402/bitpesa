'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { AVALANCHE_FUJI_CHAIN_ID } from '../config';
import { useGetBtcUsdPrice } from '../hooks/useContracts';

type Web3ContextType = {
  isConnected: boolean;
  address: string | undefined;
  chainId: number | undefined;
  btcPrice: number | null;
  isCorrectNetwork: boolean;
  switchToFujiNetwork: () => Promise<void>;
};

const Web3Context = createContext<Web3ContextType>({
  isConnected: false,
  address: undefined,
  chainId: undefined,
  btcPrice: null,
  isCorrectNetwork: false,
  switchToFujiNetwork: async () => {},
});

export const Web3Provider = ({ children }: { children: ReactNode }) => {  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { price: btcPrice } = useGetBtcUsdPrice();
  const isCorrectNetwork = chainId === AVALANCHE_FUJI_CHAIN_ID;
    const switchToFujiNetwork = async () => {
    await switchChain({ chainId: AVALANCHE_FUJI_CHAIN_ID });
  };
  
  const value = {
    isConnected,
    address,
    chainId,
    btcPrice,
    isCorrectNetwork,
    switchToFujiNetwork,
  };
  
  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
