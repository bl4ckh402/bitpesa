"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { 
  ArrowUpRight, 
  Bitcoin, 
  ChevronsUpDown, 
  Coins, 
  DollarSign,
  Filter, 
  Globe, 
  PercentIcon, 
  PiggyBank, 
  Search, 
  ShieldCheck, 
  Sparkles 
} from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";


import { YieldPoolCard } from "@/components/yield-pool-card";
import { YieldSearchFilters } from "@/components/yield-search-filters";
import { YieldStatsCards } from "@/components/yield-stats-cards";
import { YieldFarmModal } from "@/components/yield-farm-modal";
import { useCCIPBridging } from "@/lib/hooks/useCCIPBridging";
import { useGSAPCleanup } from "@/lib/gsap-cleanup";
import { cn } from "@/lib/utils";
import { CHAIN_ICONS, getDisplayBalance } from "@/lib/helpers";
import { useYieldPools } from "@/lib/hooks/useYieldPools";

// Page component
export default function EarnPage() {
  const { address } = useAccount();
  const { pools, loading, error } = useYieldPools();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [minApy, setMinApy] = useState(0);
  const [maxTvl, setMaxTvl] = useState(0);
  const [onlySafetyChecked, setOnlySafetyChecked] = useState(true);
  const [selectedPool, setSelectedPool] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Use GSAP cleanup for animations
  useGSAPCleanup();
  
  // Initialize GSAP ScrollTrigger
  useEffect(() => {
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }
    
    const ctx = gsap.context(() => {
      // Animate header section on load
      gsap.from(".earn-header", {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
      });
      
      // Stats cards animation
      gsap.from(".stats-card", {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "back.out(1.2)",
        scrollTrigger: {
          trigger: ".stats-section",
          start: "top 80%",
        },
      });
      
      // Pool cards animation on scroll
      gsap.from(".pool-card", {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".pools-section",
          start: "top 75%",
        },
      });
    });
    
    return () => ctx.revert();
  }, []);

  // Filter pools based on search and filters
  const filteredPools = useMemo(() => {
    if (!pools) return [];
    
    return pools.filter(pool => {
      // Search term filter
      if (searchTerm && !pool.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
         !pool.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Chain filter
      if (selectedChains.length > 0 && !selectedChains.includes(pool.chain)) {
        return false; 
      }
      
      // Token filter
      if (selectedTokens.length > 0 && 
         !(selectedTokens.some(token => 
           pool.tokens.map(t => t.toLowerCase()).includes(token.toLowerCase())
         ))) {
        return false;
      }
      
      // APY filter
      if (minApy > 0 && pool.apy < minApy) {
        return false;
      }
      
      // TVL filter
      if (maxTvl > 0 && pool.tvl > maxTvl) {
        return false;
      }
      
      // Safety filter
      if (onlySafetyChecked && pool.safetyScore < 7) {
        return false;
      }
      
      return true;
    }).sort((a, b) => b.apy - a.apy); // Sort by APY descending
  }, [pools, searchTerm, selectedChains, selectedTokens, minApy, maxTvl, onlySafetyChecked]);
  
  const handlePoolSelect = (pool:any) => {
    setSelectedPool(pool);
    setIsModalOpen(true);
  };
  
  // Placeholder stats data (replace with actual stats in production)
  const statsData = {
    totalValueLocked: "$4.2B",
    averageYield: "5.76%",
    highestYield: "24.3%",
    activeUsers: "15.4K"
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header section */}
      <div className="earn-header space-y-4 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              Earn with BitPesa
            </h1>
            <p className="text-slate-300 mt-2 text-lg">
              Put your idle crypto to work in curated yield farming opportunities
            </p>
          </div>
          
          {address ? (
            <Button
              variant="outline"
              className="rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/20 hover:border-orange-500/40"
            >
              <PiggyBank className="mr-2 h-4 w-4 text-orange-400" />
              My Positions
            </Button>
          ) : (
            <Button
              variant="default"
              className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              Connect Wallet to Start Earning
            </Button>
          )}
        </div>
      </div>
      
      {/* Stats section */}
      <YieldStatsCards className="stats-section mb-10" stats={statsData} />
      
      {/* Search and filters section */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-2/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by pool name or tokens..." 
              className="pl-10 bg-slate-800/50 border-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                <Badge className="ml-2 bg-orange-500 hover:bg-orange-600" variant="secondary">
                  {selectedChains.length + selectedTokens.length + (minApy > 0 ? 1 : 0) + (maxTvl > 0 ? 1 : 0) + (onlySafetyChecked ? 1 : 0)}
                </Badge>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <YieldSearchFilters 
                selectedChains={selectedChains}
                setSelectedChains={setSelectedChains}
                selectedTokens={selectedTokens}
                setSelectedTokens={setSelectedTokens}
                minApy={minApy}
                setMinApy={setMinApy}
                maxTvl={maxTvl}
                setMaxTvl={setMaxTvl}
                onlySafetyChecked={onlySafetyChecked}
                setOnlySafetyChecked={setOnlySafetyChecked}
              />
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Active filters display */}
        {(selectedChains.length > 0 || selectedTokens.length > 0 || minApy > 0 || maxTvl > 0) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedChains.map(chain => (
              <Badge 
                key={chain}
                variant="outline" 
                className="bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer"
                onClick={() => setSelectedChains(selectedChains.filter(c => c !== chain))}
              >
                {chain} ×
              </Badge>
            ))}
            
            {selectedTokens.map(token => (
              <Badge 
                key={token}
                variant="outline" 
                className="bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer"
                onClick={() => setSelectedTokens(selectedTokens.filter(t => t !== token))}
              >
                {token} ×
              </Badge>
            ))}
            
            {minApy > 0 && (
              <Badge 
                variant="outline" 
                className="bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer"
                onClick={() => setMinApy(0)}
              >
                Min APY: {minApy}% ×
              </Badge>
            )}
            
            {maxTvl > 0 && (
              <Badge 
                variant="outline" 
                className="bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer"
                onClick={() => setMaxTvl(0)}
              >
                Max TVL: ${maxTvl.toLocaleString()} ×
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-slate-400 hover:text-slate-300"
              onClick={() => {
                setSelectedChains([]);
                setSelectedTokens([]);
                setMinApy(0);
                setMaxTvl(0);
                setOnlySafetyChecked(true);
              }}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
      
      {/* Yield pools section */}
      <div className="pools-section">
        <Tabs defaultValue="all" className="w-full mb-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="all">All Protocols</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="staking">Staking</TabsTrigger>
            <TabsTrigger value="lending">Lending</TabsTrigger>
            <TabsTrigger value="lp">Liquidity Pools</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="pool-card border border-slate-700/50 bg-slate-800/20 animate-pulse h-64">
                    <div className="h-full flex items-center justify-center">
                      <Coins className="h-10 w-10 text-slate-600 animate-pulse" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 mb-2">Failed to load yield opportunities</p>
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : filteredPools.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-700 rounded-lg bg-slate-800/20">
                <Coins className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                <h3 className="text-xl font-medium text-slate-300 mb-2">No pools found</h3>
                <p className="text-slate-400 mb-4">Try adjusting your search or filters</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedChains([]);
                    setSelectedTokens([]);
                    setMinApy(0);
                    setMaxTvl(0);
                    setOnlySafetyChecked(true);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPools.map((pool) => (
                  <YieldPoolCard 
                    key={pool.id} 
                    pool={pool}
                    onSelect={() => handlePoolSelect(pool)}
                    className="pool-card"
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="featured">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPools
                .filter(pool => pool.featured)
                .map((pool) => (
                  <YieldPoolCard 
                    key={pool.id} 
                    pool={pool}
                    onSelect={() => handlePoolSelect(pool)}
                    className="pool-card"
                  />
                ))}
            </div>
          </TabsContent>
          
          {/* Additional tabs content would be similar */}
          <TabsContent value="staking">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPools
                .filter(pool => pool.category === 'staking')
                .map((pool) => (
                  <YieldPoolCard 
                    key={pool.id} 
                    pool={pool}
                    onSelect={() => handlePoolSelect(pool)}
                    className="pool-card"
                  />
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="lending">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPools
                .filter(pool => pool.category === 'lending')
                .map((pool) => (
                  <YieldPoolCard 
                    key={pool.id} 
                    pool={pool}
                    onSelect={() => handlePoolSelect(pool)}
                    className="pool-card"
                  />
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="lp">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPools
                .filter(pool => pool.category === 'lp')
                .map((pool) => (
                  <YieldPoolCard 
                    key={pool.id} 
                    pool={pool}
                    onSelect={() => handlePoolSelect(pool)}
                    className="pool-card"
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Info section */}
      <div className="mt-16 bg-slate-800/20 border border-slate-700/50 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
          <div className="md:w-1/2">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-slate-100">Safe & Seamless Yield Farming</h2>
            </div>
            <p className="text-slate-300 mb-4">
              BitPesa provides access to carefully curated yield farming opportunities across multiple blockchains. 
              We've integrated with Chainlink's Cross-Chain Interoperability Protocol (CCIP) to make cross-chain 
              farming seamless and secure.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <div className="mt-1 rounded-full bg-emerald-500/10 p-1">
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                </div>
                <span className="text-slate-300">Only audited protocols with proven track records</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 rounded-full bg-emerald-500/10 p-1">
                  <Globe className="h-3 w-3 text-emerald-500" />
                </div>
                <span className="text-slate-300">Seamless cross-chain bridging with Chainlink CCIP</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 rounded-full bg-emerald-500/10 p-1">
                  <Bitcoin className="h-3 w-3 text-emerald-500" />
                </div>
                <span className="text-slate-300">Support for WBTC, USDC, AVAX and more</span>
              </li>
            </ul>
          </div>
          
          <div className="md:w-1/2 bg-slate-850 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-xl font-semibold text-slate-100 mb-4">How It Works</h3>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-orange-500/20 text-orange-500 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-slate-200">Select a yield opportunity</h4>
                  <p className="text-slate-400 text-sm">Browse our curated list of yield farming pools across different chains</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-orange-500/20 text-orange-500 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-slate-200">Deposit your assets</h4>
                  <p className="text-slate-400 text-sm">Deposit WBTC, USDC, or other supported tokens directly from your wallet</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-orange-500/20 text-orange-500 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-slate-200">Automatic cross-chain bridging</h4>
                  <p className="text-slate-400 text-sm">We'll use Chainlink CCIP to automatically bridge your tokens if needed</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-orange-500/20 text-orange-500 font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-slate-200">Earn yield</h4>
                  <p className="text-slate-400 text-sm">Start earning yield immediately, with real-time tracking and easy withdrawals</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
      
      {/* Farm modal */}
      {selectedPool && (
        <YieldFarmModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          pool={selectedPool} 
        />
      )}
    </div>
  );
}
