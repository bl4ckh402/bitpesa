export const formatUtils = {
  /**
   * Formats a bigint or number to a BTC string with 8 decimal places
   */
  satoshiToBTC: (sats: bigint | number): string => {
    const btcValue = Number(sats) / 100000000;
    return btcValue.toFixed(8);
  },
  
  /**
   * Converts a string representing BTC amount to satoshis (bigint)
   */
  btcToSatoshi: (btcAmount: string): bigint => {
    return BigInt(Math.floor(parseFloat(btcAmount) * 100000000));
  },
  
  /**
   * Format a timestamp (nanoseconds) to a readable date string
   */
  formatTimestamp: (timestamp: bigint): string => {
    // Convert nanoseconds to milliseconds
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  },
  
  /**
   * Format dollar amounts
   */
  formatUSD: (amount: number | bigint): string => {
    return `$${Number(amount).toFixed(2)}`;
  },
  
  /**
   * Calculate interest for a loan
   */
  calculateInterest: (principal: bigint, interestRateBps: bigint, startTimestampNs: bigint): number => {
    const startTime = Number(startTimestampNs) / 1000000000; // Convert from nanoseconds to seconds
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeElapsed = now - startTime;
    
    // Calculate interest: principal * rate * time
    // (loanAmount * interestRateBps * timeElapsed) / (10000 * 365 days in seconds)
    const interestAmount =
      (Number(principal) *
        Number(interestRateBps) *
        timeElapsed) /
      (10000 * 365 * 24 * 60 * 60); // Convert from basis points (10000 = 100%)

    return interestAmount;
  },
  
  /**
   * Calculate health ratio for a loan
   */
  calculateHealthRatio: (collateralAmountSats: bigint, loanAmountUsd: bigint, btcPriceUsd: number): number => {
    if (!btcPriceUsd || Number(loanAmountUsd) === 0) return 0;
    
    const collateralValueUsd = (Number(collateralAmountSats) / 100000000) * btcPriceUsd;
    return Math.floor((collateralValueUsd / Number(loanAmountUsd)) * 100);
  }
};
