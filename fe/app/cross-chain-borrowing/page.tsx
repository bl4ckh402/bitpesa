"use client";

import { CrossChainBorrowing } from "@/components/cross-chain-borrowing";
import { TokenBridge } from "@/components/token-bridge";

export default function CrossChainBorrowingPage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Cross-Chain Borrowing with BitPesa</h1>
          <p className="text-muted-foreground">
            Deposit WBTC as collateral, take loans in USDC, and bridge your tokens across different blockchain networks using Chainlink CCIP.
          </p>
        </div>
        
        <CrossChainBorrowing />
        
        <div className="space-y-4">
          <h2 className="text-xl font-bold">How it works</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Deposit WBTC as collateral on Avalanche Fuji</li>
            <li>Take a USDC loan against your collateral</li>
            <li>Bridge your WBTC to Ethereum Sepolia or Base Sepolia using Chainlink CCIP</li>
            <li>Use your assets on multiple chains while maintaining your loan on Avalanche Fuji</li>
          </ol>
          
          <h2 className="text-xl font-bold mt-18">Supported Networks</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="font-bold">Avalanche Fuji</h3>
              <p className="text-sm text-muted-foreground">Main lending platform & collateral</p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-bold">Ethereum Sepolia</h3>
              <p className="text-sm text-muted-foreground">Bridge destination</p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-bold">Base Sepolia</h3>
              <p className="text-sm text-muted-foreground">Bridge destination</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
