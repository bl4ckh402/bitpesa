"use client";

import Image from "next/image";

interface ChainIconProps {
  chain: string;
  size?: number;
  className?: string;
}

// Mapping of chain names to their icon paths
const CHAIN_ICONS: Record<string, string> = {
  ethereum: "/images/networks/ethereum.svg",
  avalanche: "/images/networks/avalanche.svg",
  polygon: "/images/networks/polygon.svg",
  bsc: "/images/networks/bsc.svg",
  binance: "/images/networks/bsc.svg",
  optimism: "/images/networks/optimism.svg",
  arbitrum: "/images/networks/arbitrum.svg",
  base: "/images/networks/base.svg",
  sepolia: "/images/networks/ethereum.svg",
  fuji: "/images/networks/avalanche.svg",
};

export function ChainIcon({ chain, size = 16, className = "" }: ChainIconProps) {
  // Normalize the chain name to handle variations
  const normalizedChain = chain.toLowerCase();
  
  // Get the icon path or use a default
  const iconPath = CHAIN_ICONS[normalizedChain] || "/images/networks/generic.svg";
  
  return (
    <div 
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={iconPath}
        alt={chain}
        fill
        className="object-cover"
      />
    </div>
  );
}
