"use client";

import { motion } from "framer-motion";
import { ChevronRight, Flame, ShieldCheck } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

// Network icons mapping
const NETWORK_ICONS = {
  "Ethereum": "/images/networks/ethereum.svg",
  "Avalanche": "/images/networks/avalanche.svg",
  "Polygon": "/images/networks/polygon.svg",
  "BSC": "/images/networks/bsc.svg",
  "Optimism": "/images/networks/optimism.svg",
  "Arbitrum": "/images/networks/arbitrum.svg",
  "Base": "/images/networks/base.svg",
};

// Token icons mapping
const TOKEN_ICONS = {
  "WBTC": "/images/tokens/wbtc.svg",
  "USDC": "/images/tokens/usdc.svg",
  "AVAX": "/images/tokens/avax.svg",
  "ETH": "/images/tokens/eth.svg",
  "MATIC": "/images/tokens/matic.svg",
};

// Default placeholder icon
const DEFAULT_ICON = "/images/tokens/generic.svg";

import { Pool } from "@/lib/hooks/useYieldPools";

interface YieldPoolCardProps {
  pool: Pool;
  onSelect: (pool: Pool) => void;
  className?: string;
}

export function YieldPoolCard({ pool, onSelect, className }: YieldPoolCardProps) {
  // Format APY with 2 decimal places
  const formattedApy = pool.apy.toFixed(2);
  
  // Calculate safety score color
  const getSafetyColor = (score: number): string => {
    if (score >= 8) return "text-emerald-500";
    if (score >= 6) return "text-amber-500";
    return "text-red-500";
  };
  
  // Helper to get a token icon (with fallback)
  const getTokenIcon = (token: string): string => {
    return TOKEN_ICONS[token as keyof typeof TOKEN_ICONS] || DEFAULT_ICON;
  };
  
  // Helper to get network icon
  const getNetworkIcon = (network: string): string => {
    return NETWORK_ICONS[network as keyof typeof NETWORK_ICONS] || DEFAULT_ICON;
  };

  return (
    <Card 
      className={cn(
        "group overflow-hidden border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/80 backdrop-blur-sm hover:shadow-lg hover:shadow-orange-500/5 hover:border-slate-600/80 transition-all duration-300", 
        className
      )}
    >
      <CardHeader className="p-4 md:p-6 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {/* Protocol logo */}
            <div className="relative h-9 w-9 rounded-full overflow-hidden bg-slate-700">
              {pool.logo ? (
                <Image 
                  src={pool.logo} 
                  alt={pool.name} 
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400">
                  {pool.name.charAt(0)}
                </div>
              )}
            </div>
            
            <div>
              <CardTitle className="text-lg md:text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                {pool.name.toUpperCase()}
              </CardTitle>
              <div className="flex items-center gap-1.5 mt-0.5">
                {/* Network badge */}
                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-full">
                  <div className="relative h-3 w-3">
                    <Image 
                      src={getNetworkIcon(pool.chain)}
                      alt={pool.chain}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xs text-slate-400">{pool.chain}</span>
                </div>
                
                {/* Pool category badge */}
                <Badge 
                  variant="outline" 
                  className="text-[10px] py-0 border-slate-700 text-slate-400"
                >
                  {pool.category}
                </Badge>
                
                {/* Featured badge */}
                {pool.featured && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] py-0">
                    <Flame className="h-2.5 w-2.5 mr-0.5" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Safety score */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-full">
                  <ShieldCheck className={cn("h-3.5 w-3.5", getSafetyColor(pool.safetyScore))} />
                  <span className={cn("text-xs font-medium", getSafetyColor(pool.safetyScore))}>
                    {pool.safetyScore}/10
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Safety Score: Based on audits, TVL, longevity, and community trust</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 pt-2 pb-4">
        {/* Token icons */}
        <div className="flex items-center mb-4 mt-3">
          <div className="flex -space-x-3">
            {pool.tokens.slice(0, 3).map((token, i) => (
              <div 
                key={i}
                className="relative h-7 w-7 rounded-full border-2 border-slate-800 bg-slate-700 overflow-hidden"
              >
                <Image 
                  src={getTokenIcon(token)} 
                  alt={token} 
                  fill 
                  className="object-cover" 
                />
              </div>
            ))}
            
            {pool.tokens.length > 3 && (
              <div className="relative h-7 w-7 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                +{pool.tokens.length - 3}
              </div>
            )}
          </div>
          
          <div className="ml-3 text-xs text-slate-400">
            {pool.tokens.slice(0, 3).join(" + ")}
            {pool.tokens.length > 3 && " + more"}
          </div>
        </div>
        
        {/* Main stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-sm text-slate-400 mb-1">APY</div>
            <div className="font-bold text-2xl md:text-3xl text-gradient bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              {formattedApy}%
            </div>
            {pool.apyDelta > 0 && (
              <div className="text-xs text-emerald-500 mt-1">
                +{pool.apyDelta.toFixed(2)}% last 7d
              </div>
            )}
            {pool.apyDelta < 0 && (
              <div className="text-xs text-red-500 mt-1">
                {pool.apyDelta.toFixed(2)}% last 7d
              </div>
            )}
          </div>
          
          <div>
            <div className="text-sm text-slate-400 mb-1">TVL</div>
            <div className="font-bold text-xl md:text-2xl text-white">
              ${pool.tvl.toLocaleString()}
            </div>
            {/* <div className="text-xs text-slate-500 mt-1">
              Capacity: {((pool.tvl / pool.capacity) * 100).toFixed(1)}%
            </div>
            <Progress 
              value={(pool.tvl / pool.capacity) * 100} 
              className="h-1 mt-1" 
            /> */}
          </div>
        </div>
        
        {/* Risk and Prediction Information */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <div className="text-xs text-slate-400">Risk Level:</div>
                    <span className={cn(
                      "ml-1 text-xs font-medium", 
                      pool.ilRisk === 'no' ? "text-emerald-500" : 
                      pool.ilRisk === 'low' ? "text-amber-500" : "text-red-500"
                    )}>
                      {pool.ilRisk === 'no' ? 'Low' : pool.ilRisk}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Impermanent Loss Risk: {pool.ilRisk === 'no' ? 'No risk' : pool.ilRisk === 'low' ? 'Low risk' : 'High risk'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center mt-1">
                    <div className="text-xs text-slate-400">Exposure:</div>
                    <span className="ml-1 text-xs font-medium text-slate-300">
                      {pool.exposure}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Asset Exposure: {pool.exposure === 'single' ? 'Single asset (lower risk)' : 'Multiple assets'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {pool.prediction && (
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <div className="text-xs text-slate-400">Prediction:</div>
                        <span className="ml-1 text-xs font-medium text-slate-300">
                          {pool.prediction.predictedClass}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-1">
                        <div 
                          className={cn(
                            "h-full rounded-full", 
                            pool.prediction.predictedClass.includes("Up") 
                              ? "bg-emerald-500" 
                              : pool.prediction.predictedClass.includes("Stable") 
                                ? "bg-amber-500" 
                                : "bg-red-500"
                          )} 
                          style={{ width: `${pool.prediction.probability}%` }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{pool.prediction.predictedClass}</p>
                    <p>Probability: {pool.prediction.probability}%</p>
                    <p>Confidence: {pool.prediction.confidence}/3</p>
                    <p className="text-xs mt-1">Based on historical performance and market data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* 30-day APY mean if available */}
        {pool.apyMean30d && (
          <div className="mt-2 pt-2 border-t border-slate-700/50">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">30-day APY Mean:</span>
              <span className="text-xs font-medium text-slate-300">{pool.apyMean30d.toFixed(2)}%</span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 md:p-6 pt-0">
        <Button 
          onClick={() => onSelect(pool)} 
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
        >
          Farm Now
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
