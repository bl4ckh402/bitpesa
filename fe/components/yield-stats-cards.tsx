"use client";

import { Bitcoin, DollarSign, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface YieldStats {
  totalValueLocked: string;
  averageYield: string;
  highestYield: string;
  activeUsers: string;
}

interface YieldStatsCardsProps {
  stats: YieldStats;
  className?: string;
}

export function YieldStatsCards({ stats, className }: YieldStatsCardsProps) {
  const { totalValueLocked, averageYield, highestYield, activeUsers } = stats;
  
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      <Card className="stats-card border border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-slate-400">Total Value Locked</div>
            <DollarSign className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalValueLocked}</div>
          <div className="text-xs text-slate-400 mt-1">Across all supported protocols</div>
        </CardContent>
      </Card>
      
      <Card className="stats-card border border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-slate-400">Average Yield</div>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{averageYield}</div>
          <div className="text-xs text-slate-400 mt-1">Mean APY across all pools</div>
        </CardContent>
      </Card>
      
      <Card className="stats-card border border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-slate-400">Highest Yield</div>
            <TrendingUp className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-gradient bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">{highestYield}</div>
          <div className="text-xs text-slate-400 mt-1">Highest current APY offering</div>
        </CardContent>
      </Card>
      
      <Card className="stats-card border border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-slate-400">Active Users</div>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{activeUsers}</div>
          <div className="text-xs text-slate-400 mt-1">Earning yield with BitPesa</div>
        </CardContent>
      </Card>
    </div>
  );
}
