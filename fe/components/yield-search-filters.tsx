"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Globe, PercentIcon, PiggyBank, Shield, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SheetClose, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

// Available chains to filter by
const availableChains = [
  { value: "ethereum", label: "Ethereum", icon: "/images/networks/ethereum.svg" },
  { value: "avalanche", label: "Avalanche", icon: "/images/networks/avalanche.svg" },
  { value: "polygon", label: "Polygon", icon: "/images/networks/polygon.svg" },
  { value: "bsc", label: "BSC", icon: "/images/networks/bsc.svg" },
  { value: "optimism", label: "Optimism", icon: "/images/networks/optimism.svg" },
  { value: "arbitrum", label: "Arbitrum", icon: "/images/networks/arbitrum.svg" },
  { value: "base", label: "Base", icon: "/images/networks/base.svg" },
];

// Available tokens to filter by
const availableTokens = [
  { value: "wbtc", label: "WBTC", icon: "/images/tokens/wbtc.svg" },
  { value: "usdc", label: "USDC", icon: "/images/tokens/usdc.svg" },
  { value: "avax", label: "AVAX", icon: "/images/tokens/avax.svg" },
  { value: "eth", label: "ETH", icon: "/images/tokens/eth.svg" },
  { value: "matic", label: "MATIC", icon: "/images/tokens/matic.svg" },
];

interface YieldSearchFiltersProps {
  selectedChains: string[];
  setSelectedChains: (chains: string[]) => void;
  selectedTokens: string[];
  setSelectedTokens: (tokens: string[]) => void;
  minApy: number;
  setMinApy: (apy: number) => void;
  maxTvl: number;
  setMaxTvl: (tvl: number) => void;
  onlySafetyChecked: boolean;
  setOnlySafetyChecked: (checked: boolean) => void;
}

export function YieldSearchFilters({
  selectedChains,
  setSelectedChains,
  selectedTokens,
  setSelectedTokens,
  minApy,
  setMinApy,
  maxTvl,
  setMaxTvl,
  onlySafetyChecked,
  setOnlySafetyChecked
}: YieldSearchFiltersProps) {
  const [chainOpen, setChainOpen] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);
  
  // Handle chain selection
  const handleChainSelect = (value: string) => {
    if (selectedChains.includes(value)) {
      setSelectedChains(selectedChains.filter((item) => item !== value));
    } else {
      setSelectedChains([...selectedChains, value]);
    }
  };
  
  // Handle token selection
  const handleTokenSelect = (value: string) => {
    if (selectedTokens.includes(value)) {
      setSelectedTokens(selectedTokens.filter((item) => item !== value));
    } else {
      setSelectedTokens([...selectedTokens, value]);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedChains([]);
    setSelectedTokens([]);
    setMinApy(0);
    setMaxTvl(0);
    setOnlySafetyChecked(true);
  };

  return (
    <>
      <SheetHeader className="mb-6">
        <SheetTitle className="text-xl font-bold">Filter Options</SheetTitle>
      </SheetHeader>
      
      <div className="space-y-6">
        {/* Chains filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Blockchains</Label>
          <Popover open={chainOpen} onOpenChange={setChainOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={chainOpen}
                className="w-full justify-between bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
              >
                {selectedChains.length > 0
                  ? `${selectedChains.length} chain${selectedChains.length > 1 ? 's' : ''} selected`
                  : "Select chains..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-slate-800/95 backdrop-blur-lg border-slate-700">
              <Command>
                <CommandInput placeholder="Search chains..." className="border-slate-700" />
                <CommandEmpty>No chain found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {availableChains.map((chain) => (
                    <CommandItem
                      key={chain.value}
                      value={chain.value}
                      onSelect={() => handleChainSelect(chain.value)}
                      className="flex items-center hover:bg-slate-700 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="relative h-5 w-5">
                          <Image
                            src={chain.icon}
                            alt={chain.label}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span>{chain.label}</span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedChains.includes(chain.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          
          {/* Selected chains */}
          {selectedChains.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedChains.map(chainValue => {
                const chain = availableChains.find(c => c.value === chainValue);
                return (
                  <Badge 
                    key={chainValue}
                    variant="outline" 
                    className="bg-slate-800/50 hover:bg-slate-700/50 flex items-center gap-1 py-1 pl-1.5"
                  >
                    <div className="relative h-3.5 w-3.5">
                      <Image
                        src={chain?.icon || ''}
                        alt={chain?.label || ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs">{chain?.label}</span>
                    <X 
                      className="h-3.5 w-3.5 ml-1 cursor-pointer"
                      onClick={() => handleChainSelect(chainValue)} 
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
        
        <Separator className="bg-slate-700/50" />
        
        {/* Tokens filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Tokens</Label>
          <Popover open={tokenOpen} onOpenChange={setTokenOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={tokenOpen}
                className="w-full justify-between bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
              >
                {selectedTokens.length > 0
                  ? `${selectedTokens.length} token${selectedTokens.length > 1 ? 's' : ''} selected`
                  : "Select tokens..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-slate-800/95 backdrop-blur-lg border-slate-700">
              <Command>
                <CommandInput placeholder="Search tokens..." className="border-slate-700" />
                <CommandEmpty>No token found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {availableTokens.map((token) => (
                    <CommandItem
                      key={token.value}
                      value={token.value}
                      onSelect={() => handleTokenSelect(token.value)}
                      className="flex items-center hover:bg-slate-700 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="relative h-5 w-5">
                          <Image
                            src={token.icon}
                            alt={token.label}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span>{token.label}</span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedTokens.includes(token.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          
          {/* Selected tokens */}
          {selectedTokens.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedTokens.map(tokenValue => {
                const token = availableTokens.find(t => t.value === tokenValue);
                return (
                  <Badge 
                    key={tokenValue}
                    variant="outline" 
                    className="bg-slate-800/50 hover:bg-slate-700/50 flex items-center gap-1 py-1 pl-1.5"
                  >
                    <div className="relative h-3.5 w-3.5">
                      <Image
                        src={token?.icon || ''}
                        alt={token?.label || ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs">{token?.label}</span>
                    <X 
                      className="h-3.5 w-3.5 ml-1 cursor-pointer"
                      onClick={() => handleTokenSelect(tokenValue)} 
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
        
        <Separator className="bg-slate-700/50" />
        
        {/* APY range filter */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm font-medium">Minimum APY</Label>
            <div className="text-sm font-medium text-orange-500">{minApy}%</div>
          </div>
          <Slider
            defaultValue={[0]}
            value={[minApy]}
            onValueChange={(values) => setMinApy(values[0])}
            max={50}
            step={0.5}
            className="mb-6"
          />
        </div>
        
        <Separator className="bg-slate-700/50" />
        
        {/* TVL filter */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm font-medium">Maximum TVL ($ Million)</Label>
            <div className="text-sm font-medium text-orange-500">
              ${maxTvl > 0 ? maxTvl.toLocaleString() : 'Any'}
            </div>
          </div>
          <Slider
            defaultValue={[0]}
            value={[maxTvl]}
            onValueChange={(values) => setMaxTvl(values[0])}
            max={100}
            step={1}
            className="mb-6"
          />
        </div>
        
        <Separator className="bg-slate-700/50" />
        
        {/* Safety filter */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Only Safe Projects</Label>
            <p className="text-xs text-slate-400">Show only protocols with high safety scores</p>
          </div>
          <Switch
            checked={onlySafetyChecked}
            onCheckedChange={setOnlySafetyChecked}
          />
        </div>
      </div>
      
      <SheetFooter className="mt-8">
        <Button 
          variant="outline" 
          className="w-full border-slate-700 hover:bg-slate-800"
          onClick={resetFilters}
        >
          Reset Filters
        </Button>
        <SheetClose asChild>
          <Button className="w-full">Apply Filters</Button>
        </SheetClose>
      </SheetFooter>
    </>
  );
}
