"use client";

import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle, Circle, HelpCircle, Loader2, WalletCards, ExternalLink } from "lucide-react";
import Image from "next/image";
import { parseUnits, formatUnits } from "viem";
import { ethers } from "ethers";
import { type BaseError, useAccount, useBalance, usePublicClient, useSimulateContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  showBridgeInitiated, 
  showBridgeSuccess, 
  showTransactionSuccess, 
  showTransactionInitiated, 
  showTransactionError,
  DURATION
} from "@/lib/utils/toast-utils";
import { Progress } from "@/components/ui/progress";
import { useCCIPBridging, type ChainName } from "@/lib/hooks/useCCIPBridging";

import BitPesaTokenBridgeABI from "@/lib/contracts/BitPesaTokenBridge.json";
import { CHAIN_SELECTORS, TOKEN_ADDRESSES, BRIDGE_ADDRESSES } from "@/lib/constants/chains";

import { Pool } from "@/lib/hooks/useYieldPools";
import { useEffect as useLayoutEffect } from "react";

interface YieldFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: Pool;
}

export function YieldFarmModal({ isOpen, onClose, pool }: YieldFarmModalProps) {
  const [amount, setAmount] = useState("");
  const [isBridging, setIsBridging] = useState(false);
  const [isFarming, setIsFarming] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bridgeTxHash, setBridgeTxHash] = useState<string | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [bridgeFee, setBridgeFee] = useState<string>("0.002");
  const [estimatingFee, setEstimatingFee] = useState(false);
  
  const { address } = useAccount();
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { estimateFees } = useCCIPBridging();
  
  // Get token balance for the selected token
  const { data: tokenBalance } = useBalance({
    address: address,
    token: pool?.tokens?.[0] ? 
      TOKEN_ADDRESSES[(pool?.sourceChain || "AVALANCHE_FUJI") as keyof typeof TOKEN_ADDRESSES]?.[
        pool.tokens[0] as keyof (typeof TOKEN_ADDRESSES)[keyof typeof TOKEN_ADDRESSES]
      ] as `0x${string}` : undefined,
  });
  
  // Steps in the farming process
  const steps = [
    "Approve token spending",
    "Bridge tokens (if needed)",
    "Deposit into farm"
  ];
  
  // Reset state when modal is opened or pool changes
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setIsBridging(false);
      setIsFarming(false);
      setCurrentStep(0);
      setBridgeTxHash(null);
      setBridgeError(null);
    }
  }, [isOpen, pool]);

  // Estimate bridging fees when amount changes and cross-chain is needed
  useEffect(() => {
    const fetchFees = async () => {
      if (
        pool?.sourceChain !== pool?.chain &&
        amount && 
        Number(amount) > 0 &&
        pool?.tokens?.[0]
      ) {
        setEstimatingFee(true);
        try {
          // Use our CCIP bridging hook to estimate fees
          const fees = await estimateFees(
            pool.sourceChain as any || "AVALANCHE_FUJI",
            pool.chain as any,
            pool.tokens[0],
            Number(amount)
          );
          
          if (fees) {
            setBridgeFee(fees.totalFee.toString());
          }
        } catch (error) {
          console.error("Error estimating fees:", error);
        } finally {
          setEstimatingFee(false);
        }
      }
    };
    
    fetchFees();
  }, [amount, pool, estimateFees]);
  
  // Get chain selectors based on source and destination chains
  const getChainSelector = (chainName: string): string => {
    const normalizedName = chainName?.toUpperCase();
    return CHAIN_SELECTORS[normalizedName as keyof typeof CHAIN_SELECTORS] || CHAIN_SELECTORS.AVALANCHE_FUJI;
  };
  
  // Get bridge contract address for the current chain
  const getBridgeAddress = (chainName: string): string => {
    const normalizedName = chainName?.toUpperCase();
    return BRIDGE_ADDRESSES[normalizedName as keyof typeof BRIDGE_ADDRESSES] || "";
  };
  
  // Get token address on the current chain
  const getTokenAddress = (chainName: string, tokenSymbol: string): `0x${string}` => {
    const normalizedChain = chainName?.toUpperCase();
    const normalizedToken = tokenSymbol?.toUpperCase();
    const address = TOKEN_ADDRESSES[normalizedChain as keyof typeof TOKEN_ADDRESSES]?.[normalizedToken as keyof (typeof TOKEN_ADDRESSES)[keyof typeof TOKEN_ADDRESSES]] || "";
    return address as `0x${string}`;
  };
  
  // Prepare contract write for token approval
  const { data: simulateApprovalData, error: approvalError } = useSimulateContract({
    address: pool?.tokens?.[0] ? getTokenAddress(pool.sourceChain || "AVALANCHE_FUJI", pool.tokens[0]) as `0x${string}` : undefined,
    abi: [
      {
        "inputs": [
          { "internalType": "address", "name": "spender", "type": "address" },
          { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
    functionName: "approve",
    args: [
      getBridgeAddress(pool?.sourceChain || "AVALANCHE_FUJI") as `0x${string}`,
      amount ? parseUnits(amount, pool?.tokens?.[0] === "USDC" ? 6 : 8) : BigInt(0),
    ],
    query: {
      enabled: !!pool?.tokens?.[0] && !!amount && Number(amount) > 0
    },
  });
  
  const { writeContract: approveToken, isPending: isApproving, data: approvalData, error: writeError } = useWriteContract();
  
  // Prepare contract write for token bridging
  const { data: bridgePrepData, error: bridgePrepError } = useSimulateContract({
    address: getBridgeAddress(pool?.sourceChain || "AVALANCHE_FUJI") as `0x${string}`,
    abi: BitPesaTokenBridgeABI.abi,
    functionName: "transferTokensPayNative",
    args: [
      BigInt(getChainSelector(pool?.chain || "AVALANCHE_FUJI")),
      address as `0x${string}`,
      getTokenAddress(pool?.sourceChain || "AVALANCHE_FUJI", pool?.tokens?.[0] || "WBTC") as `0x${string}`,
      amount ? parseUnits(amount, pool?.tokens?.[0] === "USDC" ? 6 : 8) : BigInt(0),
    ],
    value: parseUnits(bridgeFee, 18), // Gas fee in native token
    query: {
      enabled: !!pool?.tokens?.[0] && !!amount && Number(amount) > 0 && pool?.sourceChain !== pool?.chain && !!address
    },
  });
  
  const { writeContract: bridgeTokens, isPending: isBridgeTxLoading, data: hash, error: bridgeWriteError } = useWriteContract();
  
  // Wait for transaction receipt for the approval transaction
  const { isLoading: isConfirmingApproval, isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalData,
  });
  
  // Wait for transaction receipt for the bridge transaction
  const { isLoading: isConfirmingBridge, isSuccess: isBridgeConfirmed } = useWaitForTransactionReceipt({
    hash: hash,
  });
  

  // Get decimals for the current token
  const getTokenDecimals = (tokenSymbol: string): number => {
    if (tokenSymbol === "USDC") return 6;
    return 8; // Default for WBTC and others
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !isFarming && !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="relative h-6 w-6 rounded-full overflow-hidden bg-slate-700">
              {pool?.logo ? (
                <Image 
                  src={pool.logo} 
                  alt={pool.name} 
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400">
                  {pool?.name?.charAt(0)}
                </div>
              )}
            </div>
            Farm on {pool?.name}
          </DialogTitle>
          <DialogDescription>
            Deposit your tokens to start earning {pool?.apy.toFixed(2)}% APY
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid grid-cols-2 bg-slate-800/50">
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw" disabled>Withdraw</TabsTrigger>
            </TabsList>
            
            <TabsContent value="deposit" className="space-y-4 mt-4">
              {/* Input amount */}
              <div>
                <Label htmlFor="amount" className="text-sm font-medium mb-1.5 block">
                  Amount to deposit
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isFarming}
                    className="bg-slate-800/50 border-slate-700"
                  />
                  {pool?.tokens?.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <div className="relative h-5 w-5 rounded-full overflow-hidden">
                        <Image 
                          src={`/images/tokens/${pool.tokens[0].toLowerCase()}.svg`} 
                          alt={pool.tokens[0]} 
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium">{pool.tokens[0]}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>Balance: {tokenBalance ? formatUnits(tokenBalance.value, tokenBalance.decimals) : '0.0'} {tokenBalance?.symbol}</span>
                  <button 
                    type="button" 
                    className="text-orange-500 hover:text-orange-400"
                    onClick={() => {
                      if (tokenBalance) {
                        const maxAmount = formatUnits(tokenBalance.value, tokenBalance.decimals);
                        // Reduce slightly to account for gas
                        const safeAmount = (Number(maxAmount) * 0.99).toFixed(6);
                        setAmount(safeAmount);
                      }
                    }}
                  >
                    Max
                  </button>
                </div>
              </div>
              
              {/* Cross-chain info if needed */}
              {pool?.sourceChain !== pool?.chain && (
                <div className="rounded-lg border border-dashed border-slate-700 p-4 bg-slate-800/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative h-6 w-6 rounded-full overflow-hidden">
                      <Image 
                        src={`/images/networks/${pool.sourceChain?.toLowerCase() || 'AVALANCHE_FUJI'}.svg`}
                        alt={pool.sourceChain || 'Source Chain'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                    <div className="relative h-6 w-6 rounded-full overflow-hidden">
                      <Image 
                        src={`/images/networks/${pool.chain.toLowerCase()}.svg`} 
                        alt={pool.chain} 
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-300">
                      Cross-chain transfer via BitPesa Bridge (CCIP)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">
                    This pool is on {pool.chain}. Your {pool.tokens?.[0]} will be automatically bridged from {pool.sourceChain} using BitPesa's CCIP-enabled Token Bridge.
                  </p>
                  <div className="space-y-1.5">
                    <div className="text-xs flex justify-between">
                      <span className="text-slate-400">Estimated bridging fee:</span>
                      <span className="text-slate-300 font-medium">
                        {estimatingFee ? (
                          <span className="flex items-center">
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Calculating...
                          </span>
                        ) : (
                          `~${bridgeFee} ${chain?.nativeCurrency?.symbol || 'ETH'}`
                        )}
                      </span>
                    </div>
                    <div className="text-xs flex justify-between">
                      <span className="text-slate-400">Estimated arrival time:</span>
                      <span className="text-slate-300 font-medium">~2-5 minutes</span>
                    </div>
                    
                    {bridgeTxHash && (
                      <div className="mt-2 pt-2 border-t border-slate-700">
                        <a 
                          href={`https://${pool.sourceChain?.toLowerCase() === 'AVALANCHE_FUJI' ? '' : pool.sourceChain?.toLowerCase() + '.'}etherscan.io/tx/${bridgeTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-orange-500 hover:text-orange-400"
                        >
                          View bridging transaction <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">You will receive:</span>
                  <span className="font-medium text-white">
                    {amount ? amount : '0'} {pool?.symbol || 'LP Tokens'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Expected APY:</span>
                  <span className="font-medium text-gradient bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    {pool?.apy?.toFixed(2)}%
                  </span>
                </div>
                <Separator className="my-2 bg-slate-700/50" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Daily earnings:</span>
                  <span className="font-medium text-slate-200">
                    {amount ? (Number(amount) * (pool?.apy / 100) / 365).toFixed(6) : '0'} {pool?.tokens?.[0]}
                  </span>
                </div>
              </div>
              
              {/* Steps display during farming */}
              {isFarming && (
                <div className="mt-4 space-y-4">
                  <Separator className="bg-slate-700/50" />
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {currentStep > index ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : currentStep === index ? (
                            <div className="h-5 w-5 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                            </div>
                          ) : (
                            <Circle className="h-5 w-5 text-slate-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={
                            currentStep > index
                              ? "text-green-500"
                              : currentStep === index
                              ? "text-orange-500"
                              : "text-slate-400"
                          }>
                            {step}
                          </span>
                          
                          {index === 0 && currentStep === 0 && (
                            <p className="text-xs text-slate-400 mt-1">
                              {isApproving ? "Sending approval request..." :
                              isConfirmingApproval ? "Confirming approval..." :
                              isApprovalConfirmed ? "Approval confirmed!" :
                              `Approving ${pool?.tokens?.[0]} for spending by BitPesa Token Bridge...`}
                            </p>
                          )}
                          
                          {index === 1 && currentStep === 1 && isBridging && (
                            <p className="text-xs text-slate-400 mt-1">
                              {isBridgeTxLoading ? "Sending bridge request..." :
                              isConfirmingBridge ? "Confirming bridge transaction..." : 
                              isBridgeConfirmed ? "Bridge transaction confirmed!" :
                              `Bridging ${amount} ${pool?.tokens?.[0]} from ${pool?.sourceChain} to ${pool?.chain} via CCIP...`}
                            </p>
                          )}
                          
                          {index === 2 && currentStep === 2 && (
                            <p className="text-xs text-slate-400 mt-1">
                              Depositing {amount} {pool?.tokens?.[0]} into {pool?.name} farming pool...
                            </p>
                          )}
                          
                          {bridgeError && index === 1 && (
                            <p className="text-xs text-red-400 mt-1">
                              Error: {bridgeError.length > 50 ? bridgeError.substring(0, 50) + '...' : bridgeError}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Progress value={(currentStep + 1) / steps.length * 100} className="h-1" />
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="withdraw">
              {/* Withdraw functionality would be here */}
              <div className="py-8 text-center text-slate-400">
                <WalletCards className="h-10 w-10 mx-auto mb-3 text-slate-500" />
                <p>You don't have any deposits yet.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isFarming}
            className="border-slate-700"
          >
            Cancel
          </Button>
          {/* <Button 
            onClick={handleDeposit} 
            disabled={!amount || Number(amount) <= 0 || isFarming || isApproving || isBridgeTxLoading || bridgePrepError !== null}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          >
            {isFarming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isApproving ? "Approving..." : 
                 isConfirmingApproval ? "Confirming approval..." :
                 isBridgeTxLoading ? "Bridging..." : 
                 isConfirmingBridge ? "Confirming bridge..." :
                 "Processing..."}
              </>
            ) : approvalError || bridgePrepError || writeError || bridgeWriteError ? (
              'Contract Unavailable'
            ) : (
              'Farm Now'
            )}
          </Button> */}
        </DialogFooter>
        
        {/* Display contract errors if any */}
        {(approvalError || bridgePrepError || writeError || bridgeWriteError) && (
          <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <p className="font-medium mb-1">Error:</p>
            <p>
              {(writeError || bridgeWriteError) ? 
                (writeError as Error)?.message || (bridgeWriteError as Error)?.message : 
                (approvalError || bridgePrepError)?.message || "Contract simulation failed"
              }
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
