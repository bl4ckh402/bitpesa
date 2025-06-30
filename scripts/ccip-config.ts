/**
 * CCIP Chain Selectors
 * These are unique identifiers for blockchain networks in the CCIP ecosystem
 * See: https://docs.chain.link/ccip/supported-networks
 */
export const CHAIN_SELECTORS = {
  // Testnets
  ETHEREUM_SEPOLIA: "16015286601757825753",
  AVALANCHE_FUJI: "14767482510784806043",
  POLYGON_MUMBAI: "12532609583862916517",
  
  // Mainnets
  ETHEREUM: "5009297550715157269",
  AVALANCHE: "4949039107694359620",
  POLYGON: "4051577828743386545",
  ARBITRUM: "4949039107694359620",
  OPTIMISM: "3734403246176062136",
  BASE: "15971525489660198786"
};

/**
 * CCIP Router Addresses
 * These are the deployed addresses of the CCIP Router contracts
 * See: https://docs.chain.link/ccip/supported-networks
 */
export const CCIP_ROUTERS = {
  // Testnets
  SEPOLIA: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  FUJI: "0x554472a2720e5e7d5d3c817529aba05eed5f82d8",
  MUMBAI: "0x70499c328e1e2a3c41108bd3730f6670a44595d1",
  
  // Mainnets
  ETHEREUM: "0x80226fc0Ee2b096224EeAC085Bb9a8cba1146f7D",
  AVALANCHE: "0x52abD362456aF43B5D6EDeBeE916c5A411Bf4f9B",
  POLYGON: "0x3C3D92629A02a8D95D5CB9650fe49C3544f18c1B",
  ARBITRUM: "0xE92634289A1837617890D4DF95b45f01458B89fc",
  OPTIMISM: "0x935B32111A9EdcD6852576267596e97BA9755B23",
  BASE: "0x881e3A65B4B4D67716B0B82F8873fa050397A710"
};

/**
 * LINK Token Addresses
 * These are the deployed addresses of the LINK tokens on different networks
 * See: https://docs.chain.link/resources/link-token-contracts
 */
export const LINK_TOKENS = {
  // Testnets
  SEPOLIA: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  FUJI: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
  MUMBAI: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
  
  // Mainnets
  ETHEREUM: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  AVALANCHE: "0x5947BB275c521040051D82396192181b413227A3",
  POLYGON: "0xb0897686c545045aFc77CF20eC7A532E3120E0F1",
  ARBITRUM: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
  OPTIMISM: "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6",
  BASE: "0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196"
};

// Sample CCIP message being sent
export const SAMPLE_MESSAGE = {
  // Destination blockchain selector
  destinationChainSelector: CHAIN_SELECTORS.AVALANCHE_FUJI,
  
  // Receiver address on the destination blockchain
  receiver: "0x70E2Cf32e8376923B5e1f87ca5DBbC966d6FF8Ce",
  
  // Data being sent
  data: "0x48656c6c6f20576f726c6421", // "Hello World!" in bytes
  
  // Token information if sending tokens
  token: "0xE9c27ce2fA22A3885f5d7A9996CCD76C597a752C", // WBTC on source chain
  amount: "1000000", // 0.01 WBTC (with 8 decimals)
  
  // Fee options
  feeToken: "NATIVE" // Use native token for fees, or "LINK" to use LINK tokens
};

/**
 * Environment-specific configurations
 */
export const ENVIRONMENTS = {
  development: {
    autoFundNewContracts: true,
    defaultFeeType: "NATIVE",
    defaultGasLimit: 200000,
    allowOutOfOrderExecution: false
  },
  staging: {
    autoFundNewContracts: true,
    defaultFeeType: "LINK", 
    defaultGasLimit: 200000,
    allowOutOfOrderExecution: false
  },
  production: {
    autoFundNewContracts: false,
    defaultFeeType: "LINK",
    defaultGasLimit: 200000,
    allowOutOfOrderExecution: false
  }
};
