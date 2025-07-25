// ICP Types
export type LoanId = bigint;
export type Satoshi = bigint;

export interface Loan {
  id: LoanId;
  borrower: string; // Principal ID
  collateralAmount: bigint;
  loanAmount: bigint;
  startTimestamp: bigint;
  endTimestamp: bigint;
  interestRateBps: bigint;
  active: boolean;
  liquidated: boolean;
  collateralType: { 'ckBTC': null } | { 'NativeBTC': null };
}

// More ICP types can be added here as needed
