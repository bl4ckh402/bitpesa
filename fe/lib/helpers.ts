// Helper functions for the yield farming UI

// Chain icons mapping
export const CHAIN_ICONS = {
  "Ethereum": "/images/networks/ethereum.svg",
  "Avalanche": "/images/networks/avalanche.svg",
  "Polygon": "/images/networks/polygon.svg",
  "BSC": "/images/networks/bsc.svg",
  "Optimism": "/images/networks/optimism.svg",
  "Arbitrum": "/images/networks/arbitrum.svg",
  "Base": "/images/networks/base.svg",
};

// Token icons mapping
export const TOKEN_ICONS = {
  "WBTC": "/images/tokens/wbtc.svg",
  "USDC": "/images/tokens/usdc.svg",
  "AVAX": "/images/tokens/avax.svg",
  "ETH": "/images/tokens/eth.svg",
  "MATIC": "/images/tokens/matic.svg",
};

/**
 * Format a number as a display balance
 */
export function getDisplayBalance(
  balance: number | string,
  decimals = 6,
  displayDecimals = 4
): string {
  if (!balance) return '0';
  
  const balanceNum = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  if (balanceNum === 0) return '0';
  
  // For small numbers, show more decimals
  if (balanceNum < 0.0001) {
    return '<0.0001';
  }
  
  // For other numbers, format according to the displayDecimals
  const formattedBalance = balanceNum.toFixed(displayDecimals);
  
  // Remove trailing zeros
  return formattedBalance.replace(/\.?0+$/, '');
}
