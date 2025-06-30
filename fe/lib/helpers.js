/**
 * Helper functions for the UI
 */

// Network icons mapping for chains
export const CHAIN_ICONS = {
  "ethereum": "/images/networks/ethereum.svg",
  "avalanche": "/images/networks/avalanche.svg",
  "polygon": "/images/networks/polygon.svg",
  "bsc": "/images/networks/bsc.svg",
  "optimism": "/images/networks/optimism.svg",
  "arbitrum": "/images/networks/arbitrum.svg",
  "base": "/images/networks/base.svg",
};

// Token icons mapping
export const TOKEN_ICONS = {
  "wbtc": "/images/tokens/wbtc.svg",
  "usdc": "/images/tokens/usdc.svg",
  "avax": "/images/tokens/avax.svg",
  "eth": "/images/tokens/eth.svg",
  "matic": "/images/tokens/matic.svg",
};

/**
 * Format a number for display with appropriate decimals
 * @param {number|string} value Value to format
 * @param {number} decimals Number of decimals to show
 * @returns {string} Formatted value
 */
export function getDisplayBalance(value, decimals = 8) {
  if (!value) return "0";
  
  const stringValue = typeof value === 'string' ? value : String(value);
  const parsedValue = parseFloat(stringValue);
  
  if (isNaN(parsedValue)) return "0";
  
  // For small numbers, show more decimals
  if (parsedValue < 0.01) {
    return parsedValue.toFixed(decimals);
  }
  
  // For large numbers, show fewer decimals
  if (parsedValue > 1000000) {
    return (parsedValue / 1000000).toFixed(2) + "M";
  }
  
  // For medium numbers, use fixed notation with 2-4 decimals
  if (parsedValue > 1) {
    return parsedValue.toFixed(2);
  }
  
  return parsedValue.toFixed(4);
}

/**
 * Get chain selector value for CCIP
 * @param {string} chainName Chain name
 * @returns {string} Chain selector as string
 */
export function getChainSelector(chainName) {
  const chainSelectors = {
    "ethereum": "16015286601757825753", // Sepolia testnet
    "avalanche": "14767482510784806043", // Fuji testnet
    "polygon": "12532609583862916517",  // Mumbai testnet
    "base": "5790810961207155433",    // Base Sepolia testnet
    "optimism": "2664863411364364822",  // OP Sepolia testnet
    "arbitrum": "3478487238524512106"   // Arbitrum Sepolia testnet
  };
  
  return chainSelectors[chainName.toLowerCase()] || "";
}

/**
 * Format wallet address for display
 * @param {string} address Wallet address
 * @returns {string} Formatted address (e.g. 0x1234...5678)
 */
export function formatAddress(address) {
  if (!address) return "";
  if (address.length < 10) return address;
  
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
