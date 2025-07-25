/**
 * ICP Environment Configuration
 * Manages canister IDs and network settings for different environments
 */

import { stablecoin } from "../declarations/stablecoin";

export interface CanisterIds {
  [key: string]: string;
}

export interface ICPEnvironment {
  network: 'local' | 'ic';
  host: string;
  identityProvider: string;
  canisters: CanisterIds;
}

// Default canister IDs - these should be replaced with your actual canister IDs
const DEFAULT_CANISTER_IDS: CanisterIds = {
  bitpesa_lending: process.env.NEXT_PUBLIC_BITPESA_LENDING_CANISTER_ID_LOCAL || 'u6s2n-gx777-77774-qaaba-cai',
  stablecoin:process.env.NEXT_PUBLIC_STABLECOIN_LOCAL || "umunu-kh777-77774-qaaca-cai",
  backend: process.env.NEXT_PUBLIC_BACKEND_CANISTER_ID_LOCAL || 'uxrrr-q7777-77774-qaaaq-cai',
  internet_identity: process.env.NEXT_PUBLIC_INTERNET_IDENTITY_CANISTER_ID_LOCAL || 'uzt4z-lp777-77774-qaabq-cai',
};

// Load canister IDs from environment or local files
function loadCanisterIds(): CanisterIds {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment && typeof window === 'undefined') {
    try {
      return DEFAULT_CANISTER_IDS;
    } catch (error) {
      console.warn('Could not load local canister IDs, using defaults');
      return DEFAULT_CANISTER_IDS;
    }
  }
  
  return DEFAULT_CANISTER_IDS;
}

// Get the current environment configuration
export function getICPEnvironment(): ICPEnvironment {
  const isProduction = process.env.NODE_ENV === 'production';
  const network = isProduction ? 'ic' : 'local';

  // console.log(`🔧 ICP Environment: ${network}`);
  
  const config: ICPEnvironment = {
    network,
    host: isProduction ? 'https://ic0.app' : 'http://127.0.0.1:4943',
    identityProvider: isProduction 
      ? 'https://identity.ic0.app/#authorize'
      : `http://${DEFAULT_CANISTER_IDS.internet_identity}.localhost:4943`,
    canisters: loadCanisterIds(),
  };

  // console.log('🔧 Canister IDs:', config.identityProvider);
  
  return config;
}

// Get a specific canister ID
export function getCanisterId(name: string): string {
  const env = getICPEnvironment();
  const canisterId = env.canisters[name];
  
  if (!canisterId) {
    throw new Error(`Canister ID not found for: ${name}`);
  }
  
  return canisterId;
}

// Utility to check if we're in local development
export function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

// Utility to get the current network
export function getCurrentNetwork(): 'local' | 'ic' {
  return getICPEnvironment().network;
}

// Utility to get the agent host
export function getAgentHost(): string {
  return getICPEnvironment().host;
}

// Utility to get identity provider URL
export function getIdentityProviderUrl(): string {
  return getICPEnvironment().identityProvider;
}
