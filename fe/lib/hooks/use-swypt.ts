import { useState, useEffect, useCallback } from 'react';
import { swyptSDK, SwyptQuoteRequest, SwyptQuoteResponse, SwyptSupportedAssets, SwyptOrderStatus } from '@/lib/services/swypt-sdk';

interface UseSwyptOptions {
  autoFetchAssets?: boolean;
}

export function useSwypt(options: UseSwyptOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportedAssets, setSupportedAssets] = useState<SwyptSupportedAssets | null>(null);

  // Fetch supported assets on mount
  useEffect(() => {
    if (options.autoFetchAssets !== false) {
      fetchSupportedAssets();
    }
  }, [options.autoFetchAssets]);

  const fetchSupportedAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const assets = await swyptSDK.getSupportedAssets();
      setSupportedAssets(assets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch supported assets';
      setError(errorMessage);
      console.error('Error fetching supported assets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getQuote = useCallback(async (request: SwyptQuoteRequest): Promise<SwyptQuoteResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      const quote = await swyptSDK.getQuote(request);
      return quote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get quote';
      setError(errorMessage);
      console.error('Error getting quote:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    supportedAssets,
    fetchSupportedAssets,
    getQuote,
    clearError: () => setError(null),
  };
}

interface UseSwyptOfframpOptions {
  orderID?: string;
  pollInterval?: number; // in milliseconds
}

export function useSwyptOfframp(options: UseSwyptOfframpOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<SwyptOrderStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const checkOfframpStatus = useCallback(async (orderID: string): Promise<SwyptOrderStatus | null> => {
    try {
      setLoading(true);
      setError(null);
      const status = await swyptSDK.getOfframpStatus(orderID);
      setOrderStatus(status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check offramp status';
      setError(errorMessage);
      console.error('Error checking offramp status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const processOfframp = useCallback(async (data: {
    chain: string;
    hash: string;
    partyB: string;
    tokenAddress: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await swyptSDK.processOfframp(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process offramp';
      setError(errorMessage);
      console.error('Error processing offramp:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupportTicket = useCallback(async (data: {
    orderID?: string;
    phone?: string;
    amount?: string;
    description: string;
    userAddress?: string;
    symbol?: string;
    tokenAddress?: string;
    chain?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await swyptSDK.createOfframpTicket({
        ...data,
        side: 'off-ramp',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create support ticket';
      setError(errorMessage);
      console.error('Error creating support ticket:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling functionality
  useEffect(() => {
    if (!options.orderID || !options.pollInterval || !isPolling) return;

    const interval = setInterval(() => {
      checkOfframpStatus(options.orderID!);
    }, options.pollInterval);

    return () => clearInterval(interval);
  }, [options.orderID, options.pollInterval, isPolling, checkOfframpStatus]);

  const startPolling = useCallback(() => {
    if (options.orderID) {
      setIsPolling(true);
      checkOfframpStatus(options.orderID);
    }
  }, [options.orderID, checkOfframpStatus]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  return {
    loading,
    error,
    orderStatus,
    isPolling,
    checkOfframpStatus,
    processOfframp,
    createSupportTicket,
    startPolling,
    stopPolling,
    clearError: () => setError(null),
  };
}

interface UseSwyptOnrampOptions {
  orderID?: string;
  pollInterval?: number; // in milliseconds
}

export function useSwyptOnramp(options: UseSwyptOnrampOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<SwyptOrderStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const initiateOnramp = useCallback(async (data: {
    partyA: string;
    amount: string;
    userAddress: string;
    tokenAddress: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await swyptSDK.initiateOnramp({
        ...data,
        side: 'onramp',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate onramp';
      setError(errorMessage);
      console.error('Error initiating onramp:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkOnrampStatus = useCallback(async (orderID: string): Promise<SwyptOrderStatus | null> => {
    try {
      setLoading(true);
      setError(null);
      const status = await swyptSDK.getOnrampStatus(orderID);
      setOrderStatus(status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check onramp status';
      setError(errorMessage);
      console.error('Error checking onramp status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const processDeposit = useCallback(async (data: {
    chain: string;
    address: string;
    orderID: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await swyptSDK.processDeposit({
        ...data,
        project: 'onramp',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process deposit';
      setError(errorMessage);
      console.error('Error processing deposit:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupportTicket = useCallback(async (data: {
    orderID?: string;
    phone?: string;
    amount?: string;
    description: string;
    userAddress?: string;
    symbol?: string;
    tokenAddress?: string;
    chain?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await swyptSDK.createOnrampTicket({
        ...data,
        side: 'on-ramp',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create support ticket';
      setError(errorMessage);
      console.error('Error creating support ticket:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling functionality
  useEffect(() => {
    if (!options.orderID || !options.pollInterval || !isPolling) return;

    const interval = setInterval(() => {
      checkOnrampStatus(options.orderID!);
    }, options.pollInterval);

    return () => clearInterval(interval);
  }, [options.orderID, options.pollInterval, isPolling, checkOnrampStatus]);

  const startPolling = useCallback(() => {
    if (options.orderID) {
      setIsPolling(true);
      checkOnrampStatus(options.orderID);
    }
  }, [options.orderID, checkOnrampStatus]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  return {
    loading,
    error,
    orderStatus,
    isPolling,
    initiateOnramp,
    checkOnrampStatus,
    processDeposit,
    createSupportTicket,
    startPolling,
    stopPolling,
    clearError: () => setError(null),
  };
}
