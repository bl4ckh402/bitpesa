'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBitPesa } from "@/lib/hooks/useBitPesa";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { useState, useEffect } from "react";

export function BtcPriceDisplay() {
  const { btcPrice, isLoadingBtcPrice } = useBitPesa();
  const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  
  useEffect(() => {
    if (btcPrice !== null && prevPrice !== null) {
      setPriceChange(btcPrice > prevPrice ? 'up' : 'down');
      
      const timer = setTimeout(() => {
        setPriceChange(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    if (btcPrice !== null && prevPrice === null) {
      setPrevPrice(btcPrice);
    }
  }, [btcPrice]);
  
  useEffect(() => {
    if (btcPrice !== null && btcPrice !== prevPrice) {
      setPrevPrice(btcPrice);
    }
  }, [btcPrice]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Bitcoin Price</CardTitle>
        <CardDescription>Live data from Chainlink</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {isLoadingBtcPrice ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              <span className={priceChange === 'up' ? 'text-green-500' : priceChange === 'down' ? 'text-red-500' : ''}>
                ${btcPrice ? btcPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
              </span>
            )}
          </div>
          {priceChange && (
            <div className={`rounded-full p-1 ${priceChange === 'up' ? 'bg-green-100' : 'bg-red-100'}`}>
              {priceChange === 'up' ? (
                <ArrowUpIcon className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 text-red-500" />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
