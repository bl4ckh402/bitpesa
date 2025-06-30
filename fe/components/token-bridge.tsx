"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useBitPesa } from "@/lib/hooks/useBitPesa";
import { useTokenAllowance } from "@/lib/hooks/useTokenAllowance";
import {
  contractAddresses,
  AVALANCHE_FUJI_CHAIN_ID,
  ETHEREUM_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
} from "@/lib/config";
import { parseUnits } from "viem";

export function TokenBridge() {
  const [amount, setAmount] = useState("");
  const [destinationChain, setDestinationChain] = useState(
    ETHEREUM_SEPOLIA_CHAIN_ID.toString()
  );
  const [recipientAddress, setRecipientAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"LINK" | "NATIVE">("LINK");

  const {
    address,
    isConnected,
    contractHooks: {
      useTransferTokens,
      useTransferTokensPayLink,
      useTransferTokensPayNative,
      useWBTCBalance,
      useApproveWBTC
    },
  } = useBitPesa();

  // WBTC balance
  const { balance: wbtcBalance } = useWBTCBalance(address);

  // Check WBTC allowance for bridge
  const { allowance, hasAllowance } = useTokenAllowance(
    "WBTC",
    address,
    contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaTokenBridge as string
  );
  // Set up bridge approval
  const { approve, isPending: isApprovePending } = useApproveWBTC();

  // Set up transfer with different payment methods
  const { transferTokens, isPending: isTransferPending } = useTransferTokens();
  const { transferTokens: transferTokensPayLink, isPending: isTransferLinkPending } = useTransferTokensPayLink();
  const { transferTokens: transferTokensPayNative, isPending: isTransferNativePending } = useTransferTokensPayNative();
  
  // Handle approval for bridge
  const handleApprove = () => {
    if (!amount || !address) return;
    approve(amount);
  };

  // Handle transfer based on selected payment method
  const handleTransfer = () => {
    if (!amount || !recipientAddress) return;
    
    const destChainSelector = BigInt(destinationChain);
    
    if (paymentMethod === "LINK") {
      transferTokensPayLink(destChainSelector, recipientAddress, amount);
    } else if (paymentMethod === "NATIVE") {
      transferTokensPayNative(destChainSelector, recipientAddress, amount);
    } else {
      transferTokens(destChainSelector, recipientAddress, amount);
    }
  };
  
  // Check if needs approval
  const needsApproval = () => {
    if (!amount) return false;
    const amountToCheck = parseUnits(amount, 8);
    return !hasAllowance(amountToCheck as bigint);
  };
  
  // Determine if any transfer is pending
  const isAnyTransferPending = isTransferPending || isTransferLinkPending || isTransferNativePending;

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bridge WBTC</CardTitle>
          <CardDescription>
            Connect your wallet to bridge tokens
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bridge WBTC</CardTitle>
        <CardDescription>
          Your WBTC Balance: {wbtcBalance || "0.0"} WBTC
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="amount">Amount to Bridge</Label>
            <Input
              id="amount"
              placeholder="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="destination">Destination Chain</Label>
            <Select
              value={destinationChain}
              onValueChange={setDestinationChain}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination chain" />
              </SelectTrigger>              <SelectContent>
                <SelectItem value={ETHEREUM_SEPOLIA_CHAIN_ID.toString()}>
                  Ethereum (Sepolia)
                </SelectItem>
                <SelectItem value={BASE_SEPOLIA_CHAIN_ID.toString()}>
                  Base (Sepolia)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {needsApproval() ? (
          <Button onClick={handleApprove} disabled={isApprovePending}>
            {isApprovePending ? "Approving..." : "Approve WBTC"}
          </Button>
        ) : (
          <Button
            onClick={handleTransfer}
            disabled={isTransferPending || !amount || !recipientAddress}
          >
            {isTransferPending ? "Transferring..." : "Bridge Tokens"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
