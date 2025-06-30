"use client";

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from 'sonner';

import { useCCIPBridging, type ChainName } from '@/lib/hooks/useCCIPBridging';
import { TOKEN_ADDRESSES, BRIDGE_ADDRESSES } from '@/lib/constants/chains';

interface BridgeFormProps {
  poolChain: string;  // The destination chain where the yield farm is located
  tokenSymbol: string; // The token to bridge (WBTC, USDC, etc.)
  onSuccess?: () => void;
}

export function CCIPBridgeForm({ poolChain, tokenSymbol, onSuccess }: BridgeFormProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState<string>('');
  const [sourceChain, setSourceChain] = useState<string>('AVALANCHE_FUJI'); // Default to Fuji testnet
  
  // Use our bridging hook
  const { 
    bridgeTokens, 
    bridgingFees, 
    bridgingState, 
    estimateFees,
    isPending, 
    isConfirming,
    isSuccess
  } = useCCIPBridging();
  
  // Calculate estimated fees when the form values change
  const handleCalculateFees = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    const fees = await estimateFees(
      sourceChain as ChainName, 
      poolChain as ChainName, 
      tokenSymbol, 
      parseFloat(amount)
    );
    if (fees) {
      toast.info(`Estimated fees: ${fees.totalFee.toFixed(6)} native tokens`);
    }
  };
  
  // Handle the bridge action
  const handleBridge = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    try {
      // Use the payNative method which is most straightforward for users
      const result = await bridgeTokens(
        sourceChain as ChainName,
        poolChain as ChainName,
        tokenSymbol,
        amount,
        address as string, // Recipient is the same wallet address
        'payNative'
      );
      
      if (result.success) {
        toast.success(`Successfully initiated bridging of ${amount} ${tokenSymbol} to ${poolChain}`);
        if (onSuccess) onSuccess();
      } else {
        toast.error(`Failed to bridge tokens: ${result.error}`);
      }
    } catch (error) {
      console.error("Bridge error:", error);
      toast.error("An unexpected error occurred while bridging tokens");
    }
  };
  
  // Loading states
  const isWorking = isPending || isConfirming || bridgingState.isLoading;
  
  return (
    <Card className="border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">Bridge {tokenSymbol} to {poolChain}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Source Chain</label>
          <Select 
            value={sourceChain} 
            onValueChange={setSourceChain}
            disabled={isWorking}
          >
            <SelectTrigger className="bg-slate-800/80 border-slate-700">
              <SelectValue placeholder="Select source chain" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="FUJI">Avalanche Fuji</SelectItem>
              <SelectItem value="SEPOLIA">Ethereum Sepolia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Amount to Bridge</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isWorking}
              className="bg-slate-800/80 border-slate-700"
            />
            <span className="text-sm font-medium text-slate-300">{tokenSymbol}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Bridge Fee:</span>
          <span>{bridgingFees.totalFee > 0 ? `~${bridgingFees.totalFee.toFixed(6)} native` : 'Calculate first'}</span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCalculateFees}
          disabled={isWorking || !amount}
          className="w-full text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
        >
          Calculate Fees
        </Button>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          onClick={handleBridge}
          disabled={isWorking || !amount || parseFloat(amount) <= 0}
        >
          {isWorking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isConfirming ? 'Confirming...' : 'Processing...'}
            </>
          ) : (
            <>
              Bridge to {poolChain} <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
