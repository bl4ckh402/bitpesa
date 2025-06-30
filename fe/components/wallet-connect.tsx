'use client';

import { Button } from "@/components/ui/button";
import { useBitPesa } from "@/lib/hooks/useBitPesa";
import { useAppKit } from '@reown/appkit/react';
import { ChevronRightIcon, AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function WalletConnect() {
  const { open } = useAppKit();
  const { isConnected, address, isCorrectNetwork, switchToFujiNetwork } = useBitPesa();
  
  const openConnectModal = () => {
    open({ view: 'Connect' });
  };
  
  const openAccountModal = () => {
    open({ view: 'Account' });
  };
  
  if (!isConnected) {
    return (
      <Button variant="outline" onClick={openConnectModal}>
        Connect Wallet
      </Button>
    );
  }

  // Show network warning if on wrong network
  if (!isCorrectNetwork) {
    return (
      <div className="space-y-3">
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Wrong Network</AlertTitle>
          <AlertDescription>
            Please switch to Avalanche Fuji testnet to use BitPesa.
          </AlertDescription>
        </Alert>
        <Button onClick={switchToFujiNetwork}>
          Switch to Fuji Testnet
        </Button>
      </div>
    );
  }

  // Connected and on correct network - show address
  return (
    <Button variant="outline" className="gap-2" onClick={openAccountModal}>
      <span>
        {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
      </span>
      <ChevronRightIcon className="h-4 w-4" />
    </Button>
  );
}
