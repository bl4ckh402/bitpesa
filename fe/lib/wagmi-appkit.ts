'use client';

import { createAppKit } from '@reown/appkit/react';
import { avalancheFuji, goerli } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { AppKitNetwork } from '@reown/appkit/networks'
import { cookieStorage, createStorage } from 'wagmi';
// Get projectId from environment variable or use a default one
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Define metadata for your dApp
const metadata = {
    name: 'BitPesa',
    description: 'BitPesa DeFi Platform',
    url: 'https://bitpesa.app',
    icons: ['https://bitpesa.app/icon.png']
};

export const networks = [avalancheFuji, goerli] as [AppKitNetwork, ...AppKitNetwork[]]

// Create the Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage
    }),
    ssr: true,
    projectId,
    networks
})

// Create AppKit instance with the adapter
export const appKit = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks,
    metadata: metadata,
    features: {
        analytics: true,
    }
});

// Export the wagmi config for use in the provider
export const config = wagmiAdapter.wagmiConfig;
