'use client';

import React, { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ICPAuthProvider } from '../context/ICPAuthContext';
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
        <ICPAuthProvider>
          <GSAPCleanupProvider>
            {children}
          </GSAPCleanupProvider>
        </ICPAuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
