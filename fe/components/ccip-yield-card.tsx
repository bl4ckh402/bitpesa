"use client";

import { useState } from 'react';
import { ChainIcon } from "@/components/chain-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, ArrowRight } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface YieldOpportunity {
  id: string;
  name: string;
  protocol: string;
  protocolLogo: string;
  chain: string;
  tokens: string[];
  tokenLogos: string[];
  apy: number;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
  isBoosted?: boolean;
}

interface CCIPYieldCardProps {
  opportunity: YieldOpportunity;
  userSourceChain?: string;
  onFarmClick: (opportunity: YieldOpportunity) => void;
}

export function CCIPYieldCard({ opportunity, userSourceChain = 'ethereum', onFarmClick }: CCIPYieldCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Check if cross-chain transfer is needed
  const needsBridging = userSourceChain.toLowerCase() !== opportunity.chain.toLowerCase();
  
  // Format APY with 2 decimal places
  const formattedApy = opportunity.apy.toFixed(2);
  
  // Format TVL to human readable
  const formatTVL = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}K`;
    } else {
      return `$${value}`;
    }
  };

  // Get background color for risk badge
  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400';
      case 'high':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <Card
      className={`relative overflow-hidden border border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/80 backdrop-blur-sm transition-all duration-300 ${
        isHovered
          ? 'shadow-lg shadow-orange-500/10 border-slate-600/50 transform scale-[1.02]'
          : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {opportunity.isBoosted && (
        <div className="absolute top-0 right-0">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-none rounded-bl-lg">
            BOOSTED
          </Badge>
        </div>
      )}
      
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
              {opportunity.protocolLogo ? (
                <img src={opportunity.protocolLogo} alt={opportunity.protocol} className="h-full w-full object-cover" />
              ) : (
                <span className="text-slate-300 font-medium">{opportunity.protocol.charAt(0)}</span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">{opportunity.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ChainIcon chain={opportunity.chain.toLowerCase()} size={16} />
                <span className="text-xs text-slate-400">{opportunity.chain}</span>
                
                <Badge 
                  variant="outline" 
                  className={`text-[10px] py-0 ml-1 ${getRiskColor(opportunity.risk)}`}>
                  {opportunity.risk.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-bold text-2xl text-gradient bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              {formattedApy}%
            </div>
            <div className="text-xs text-slate-400">APY</div>
          </div>
        </div>
        
        <div className="flex items-center mb-6">
          <div className="flex -space-x-2">
            {opportunity.tokenLogos.map((logo, i) => (
              <div 
                key={i}
                className="relative h-6 w-6 rounded-full border-2 border-slate-800 bg-slate-700 overflow-hidden"
              >
                <img src={logo} alt={opportunity.tokens[i]} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          
          <div className="ml-2 text-xs text-slate-400">
            {opportunity.tokens.join(" + ")}
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-5 text-sm">
          <div className="text-slate-400">TVL: <span className="text-slate-300">{formatTVL(opportunity.tvl)}</span></div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-slate-400 cursor-help">
                  <Info className="h-3.5 w-3.5" />
                  {needsBridging ? 'Needs Bridging' : 'Direct Deposit'}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {needsBridging 
                  ? `Your assets on ${userSourceChain} will be automatically bridged to ${opportunity.chain} using CCIP`
                  : `Your assets are already on ${opportunity.chain}, no bridging needed`
                }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Button 
          onClick={() => onFarmClick(opportunity)}
          className={`w-full ${
            needsBridging
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
          } text-white group`}
        >
          {needsBridging ? 'Bridge & Farm' : 'Farm Now'}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
