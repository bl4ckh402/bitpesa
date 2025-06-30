// Contract addresses configuration
export const AVALANCHE_FUJI_CHAIN_ID = 43113;
export const ETHEREUM_GOERLI_CHAIN_ID = 5;
export const ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;

export type ContractConfig = {
  [chainId: number]: {
    BitPesaLending: string;
    BitPesaPriceConsumer: string;
    BitPesaTokenBridge: string;
    BitPesaWill: string; // Added BitPesaWill
    WBTC: string;
    USDC: string;
  };
};

// Contract addresses by chain
// Add BASE_SEPOLIA chain ID
export const BASE_SEPOLIA_CHAIN_ID = 84532;

export const contractAddresses: ContractConfig = {
  [AVALANCHE_FUJI_CHAIN_ID]: {
    BitPesaLending: process.env.NEXT_PUBLIC_BITPESA_LENDING_ADDRESS!,
    BitPesaPriceConsumer: '0xD8AF5630b4Fef7C84Ed7c82e376f00faC3b644C9',
    BitPesaTokenBridge: process.env.NEXT_PUBLIC_TOKEN_BRIDGE_ADDRESS!,
    BitPesaWill: process.env.NEXT_PUBLIC_WILL_ADDRESS!,  // Wills contract address
    WBTC: process.env.NEXT_PUBLIC_WBTC_ADDRESS_SUPPORTED!,  // WBTC address for bridging
    USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS!,   // Mock USDC address
  },
  [ETHEREUM_GOERLI_CHAIN_ID]: {
    BitPesaLending: '',  // Not deployed on Goerli
    BitPesaPriceConsumer: '',  // Not deployed on Goerli
    BitPesaTokenBridge: '',  // For cross-chain bridging
    BitPesaWill: '',  // Not deployed on Goerli
    WBTC: '',
    USDC: '',
  },
};

export const supportedChains = [
  AVALANCHE_FUJI_CHAIN_ID,
  ETHEREUM_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
  // Add other chains as they become supported
];

export const EXPLORER_URLS: { [chainId: number]: string } = {
  [AVALANCHE_FUJI_CHAIN_ID]: 'https://testnet.snowtrace.io',
  [ETHEREUM_GOERLI_CHAIN_ID]: 'https://goerli.etherscan.io',
  [ETHEREUM_SEPOLIA_CHAIN_ID]: 'https://sepolia.etherscan.io',
  [BASE_SEPOLIA_CHAIN_ID]: 'https://sepolia.basescan.org',
};

export default contractAddresses;
