'use client';

import React, { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Web3Provider } from './web3-provider';
import { ContractProvider } from '../context/ContractContext';
import { config, appKit } from '../wagmi-appkit';
import { GSAPCleanupProvider } from '@/components/providers/gsap-cleanup-provider';

// Create a react-query client
const queryClient = new QueryClient();

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <GSAPCleanupProvider>
          <Web3Provider>
            <ContractProvider>
              {children}
            </ContractProvider>
          </Web3Provider>
        </GSAPCleanupProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
