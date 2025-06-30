'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

interface AssetVisualizerProps {
  amount: string;
  className?: string;
  bitcoinPrice?: number;
  coinSymbol?: string;
  showValue?: boolean;
}

export function AssetVisualizer({
  amount,
  className,
  bitcoinPrice = 60000, // Default price if not provided
  coinSymbol = 'WBTC',
  showValue = true
}: AssetVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const coinsRef = useRef<HTMLDivElement>(null);
  
  // Animate coins when amount changes
  useEffect(() => {
    if (!coinsRef.current || !amount) return;
    
    const numCoins = Math.min(Math.ceil(parseFloat(amount) * 10), 50); // Cap at 50 coins
    const coins: HTMLDivElement[] = [];
    
    // Clear previous coins
    coinsRef.current.innerHTML = '';
    
    // Create coin elements
    for (let i = 0; i < numCoins; i++) {
      const coin = document.createElement('div');
      coin.className = 'coin absolute rounded-full bg-gradient-to-br from-[#f7931a] to-[#ff6b35] shadow-lg flex items-center justify-center';
      coin.style.width = `${Math.max(20, Math.min(40, 40 - (numCoins / 2)))}px`;
      coin.style.height = coin.style.width;
      
      // Add Bitcoin symbol
      const symbol = document.createElement('div');
      symbol.className = 'text-white font-bold text-[10px]';
      symbol.innerHTML = '₿';
      coin.appendChild(symbol);
      
      coinsRef.current.appendChild(coin);
      coins.push(coin);
    }
    
    // Position and animate coins
    gsap.set(coins, { 
      x: "random(-50, 50)",
      y: "random(-30, 30)",
      rotation: "random(-15, 15)",
      scale: 0,
      opacity: 0
    });
    
    gsap.to(coins, {
      scale: 1,
      opacity: 1,
      stagger: 0.02,
      duration: 0.5,
      ease: "back.out(1.7)"
    });
    
    // Add hover animation
    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', (e) => {
        const rect = containerRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        coins.forEach((coin) => {
          const coinRect = coin.getBoundingClientRect();
          const coinX = coinRect.left - rect.left + coinRect.width/2;
          const coinY = coinRect.top - rect.top + coinRect.height/2;
          
          // Calculate distance
          const distX = mouseX - coinX;
          const distY = mouseY - coinY;
          const distance = Math.sqrt(distX * distX + distY * distY);
          
          // Move away from cursor
          if (distance < 100) {
            const pushFactor = (100 - distance) / 500;
            gsap.to(coin, {
              x: `+=${-distX * pushFactor}`,
              y: `+=${-distY * pushFactor}`,
              duration: 0.5,
              ease: "power2.out"
            });
          }
        });
      });
    }
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', () => {});
      }
    };
  }, [amount]);
  
  const usdValue = parseFloat(amount || '0') * bitcoinPrice;
  
  return (
    <motion.div 
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-xl p-6 border border-gray-200", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-medium text-white/70 mb-2">Asset Visualization</h3>
        
        <div className="mt-2 mb-6">
          <div className="text-center">
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f7931a] to-[#ff6b35]">
              {parseFloat(amount || '0').toFixed(8)}
            </span>
            <span className="ml-2 text-xl font-medium text-white/70">{coinSymbol}</span>
          </div>
          
          {showValue && (
            <div className="text-center mt-1 text-white/70">
              ≈ ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
            </div>
          )}
        </div>
        
        <div 
          ref={coinsRef} 
          className="relative h-40 w-full"
        />
      </div>
    </motion.div>
  );
}
