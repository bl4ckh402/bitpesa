'use client';

import React, { ReactNode } from 'react';
import { WagmiProvider, type Config } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Web3Provider } from './web3-provider';
import { ContractProvider } from '../context/ContractContext';
import { config } from '../wagmi-appkit';

// Create a react-query client
const queryClient = new QueryClient();

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <WagmiProvider config={config as Config}>
      <QueryClientProvider client={queryClient}>
          <Web3Provider>
            <ContractProvider>
              {children}
            </ContractProvider>
          </Web3Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
