"use client";

import { useState, useEffect } from 'react';

// Cache management for DefiLlama API responses
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Cache duration in milliseconds (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

// Cache storage - using a simple object for client-side caching
const apiCache: Record<string, CacheItem<any>> = {};

/**
 * Fetch data with caching to prevent excessive API calls
 */
async function fetchWithCache<T>(url: string, cacheDuration = CACHE_DURATION): Promise<T> {
  const cacheKey = url;
  const now = Date.now();
  
  // Check if we have a valid cached response
  if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < cacheDuration) {
    return apiCache[cacheKey].data;
  }
  
  try {
    // Fetch fresh data if no cache or cache expired
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    apiCache[cacheKey] = {
      data,
      timestamp: now
    };
    
    return data;
  } catch (error) {
    // If we have an expired cache entry, return it instead of failing
    if (apiCache[cacheKey]) {
      console.warn(`Failed to fetch fresh data, using stale cache for ${url}`, error);
      return apiCache[cacheKey].data;
    }
    // Otherwise, rethrow the error
    throw error;
  }
}

// Define the Pool type based on DefiLlama API response (updated according to API docs)
export interface DefiLlamaYieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apyReward: number | null;
  apy: number | null;
  rewardTokens: string[] | null;
  pool: string;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  predictions?: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  };
  poolMeta: string | null;
  underlyingTokens: string[] | null;
  // Additional fields from the DefiLlama API response
  mu?: number;
  sigma?: number;
  count?: number;
  outlier?: boolean;
  il7d?: number | null;
  apyBase7d?: number | null;
  apyMean30d?: number | null;
  volumeUsd1d?: number | null;
  volumeUsd7d?: number | null;
  apyBaseInception?: number | null;
}

// Our application's Pool type
export interface Pool {
  id: string;
  name: string;
  symbol: string;
  logo?: string;
  chain: string;
  sourceChain?: string;
  category: 'staking' | 'lending' | 'lp';
  tokens: string[];
  apy: number;
  apyDelta: number;
  tvl: number;
//   capacity: number;
  safetyScore: number;
  featured: boolean;
  // Added fields for improved risk information display
  ilRisk: string;
  exposure: string;
  prediction?: {
    predictedClass: string;
    probability: number;
    confidence: number;
  };
  stablecoin: boolean;
  apyMean30d?: number;
}

export function useYieldPools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // DefiLlama API URL for yield pools
  const DEFILLAMA_YIELD_API_URL = 'https://yields.llama.fi/pools';
  
  // Chains and tokens we're interested in
  const SUPPORTED_CHAINS = ['Ethereum', 'Avalanche', 'Base'];
  const SUPPORTED_TOKENS = ['USDC', 'BTC', 'WBTC', 'WAVAX', 'ETH'];
  const MIN_APY = 2; // 2% minimum APY

  // Function to fetch pools data
  const fetchPools = async (skipCache = false) => {
    setLoading(true);
    try {
      // Fetch data from DefiLlama API
      const response = await fetchWithCache<{ data: DefiLlamaYieldPool[] }>(
        DEFILLAMA_YIELD_API_URL, 
        skipCache ? 0 : CACHE_DURATION
      );
      
      const pools = Array.isArray(response) ? response : response.data;
      
      if (!pools || !Array.isArray(pools)) {
        throw new Error('Invalid response format from DefiLlama API');
      }
      
      // Map DefiLlama data to our Pool interface
      const mappedPools: Pool[] = pools
        .filter((pool: DefiLlamaYieldPool) => {
          // Filter by chain
          if (!SUPPORTED_CHAINS.includes(pool.chain)) {
            return false;
          }
          
          // Filter by minimum APY
          if (!pool.apy || pool.apy < MIN_APY) {
            return false;
          }

          // Filter by tokens (either in symbol or in underlyingTokens)
          let hasMatchingToken = false;
          
          // Check if symbol contains any of our supported tokens
          if (SUPPORTED_TOKENS.some(token => 
            pool.symbol.toUpperCase().includes(token)
          )) {
            hasMatchingToken = true;
          }
          
          // Check underlyingTokens for native tokens
          if (pool.underlyingTokens && 
              pool.underlyingTokens.includes("0x0000000000000000000000000000000000000000") &&
              ((pool.chain === "Ethereum" && SUPPORTED_TOKENS.includes("ETH")) || 
               (pool.chain === "Avalanche" && SUPPORTED_TOKENS.includes("WAVAX")))) {
            hasMatchingToken = true;
          }

          // Only allow pools with low or medium risk
          const isLowRisk = pool.ilRisk === 'no' || pool.ilRisk === 'low';
          
          // We want stable prediction patterns
          const hasGoodPrediction = pool.predictions && 
            (pool.predictions.predictedClass === 'Stable/Up' || 
             pool.predictions.predictedClass === 'Stable') &&
            pool.predictions.predictedProbability > 60;

          // Prioritize stablecoins but don't require them
          const isStable = pool.stablecoin || 
                         pool.symbol.includes('USD') || 
                         pool.symbol.includes('DAI') ||
                         pool.symbol.includes('USDC') || 
                         pool.symbol.includes('USDT');
            
          console.log(`Checking pool: ${pool.project} (${pool.chain}) - Risk: ${pool.ilRisk} - Prediction: ${pool.predictions?.predictedClass || 'none'} - Stable: ${isStable} - hasMatchingToken: ${hasMatchingToken}`);

          // Minimum TVL requirement with risk and prediction assessment
          // We prioritize low risk, good prediction pools
          return hasMatchingToken && pool.tvlUsd > 1000000 && isLowRisk && hasGoodPrediction;
        })
        .sort((a, b) => b.apy! - a.apy!) // Sort by APY (highest first)
        .slice(0, 50) // Get top 50 pools after filtering
        .map((pool: DefiLlamaYieldPool) => {
          // Determine category based on project and pool metadata
          let category: 'staking' | 'lending' | 'lp' = 'staking';
          if (pool.project.toLowerCase().includes('swap') || pool.exposure === 'multi') {
            category = 'lp';
          } else if (pool.project.toLowerCase().includes('lend') || 
                    pool.project.toLowerCase().includes('aave') ||
                    pool.project.toLowerCase().includes('compound')) {
            category = 'lending';
          }
          
          // Generate a reasonable project name
          const name = `${pool.project} ${pool.symbol}`;
          
          // Determine tokens from symbol and underlying tokens
          const tokens = pool.underlyingTokens && pool.underlyingTokens.length > 0 
            ? pool.underlyingTokens.map(token => {
                // Convert address to symbol if possible, or use last part of address
                if (token === "0x0000000000000000000000000000000000000000") {
                  return pool.chain === "Ethereum" ? "ETH" : 
                         pool.chain === "Avalanche" ? "AVAX" :
                         pool.chain === "Base" ? "ETH" :
                         "NATIVE";
                }
                return token.substring(token.length - 6); // Use last 6 chars as token symbol
              })
            : [pool.symbol];
            
          // Make a logo path based on project name
          const logoPath = `/images/protocols/${pool.project.toLowerCase().replace(/\s+/g, '')}.svg`;
          
          return {
            id: pool.pool,
            name,
            symbol: pool.symbol,
            logo: logoPath,
            chain: pool.chain,
            sourceChain: undefined,
            category,
            tokens,
            apy: pool.apy || 0,
            apyDelta: pool.apyPct7D || 0,
            tvl: pool.tvlUsd,
            // capacity: pool.tvlUsd * 2, // Just an estimate for capacity
            safetyScore: Math.min(Math.round((pool.predictions?.binnedConfidence || 0) * 3) + 5, 10), // Convert confidence to a 1-10 score
            featured: Boolean(pool.tvlUsd > 10000000 && (pool.apy || 0) > 5), // Feature high TVL, high APY pools
            ilRisk: pool.ilRisk,
            exposure: pool.exposure,
            prediction: pool.predictions ? {
              predictedClass: pool.predictions.predictedClass,
              probability: pool.predictions.predictedProbability,
              confidence: pool.predictions.binnedConfidence
            } : undefined,
            stablecoin: pool.stablecoin || pool.symbol.includes('USD') || pool.symbol.includes('DAI') || pool.symbol.includes('USDC') || pool.symbol.includes('USDT'),
            apyMean30d: pool.apyMean30d || undefined
          };
        });
        
      setPools(mappedPools);
    } catch (err) {
      console.error('Error fetching yield pools:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch pools'));
      
      // Fallback to empty array if fetch fails
      setPools([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  return { 
    pools, 
    loading, 
    error, 
    refreshPools: () => fetchPools(true) // Function to manually refresh data by skipping cache
  };
}
