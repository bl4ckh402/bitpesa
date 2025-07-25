'use client';

import { useState, useEffect } from 'react';
import { useICPHelpers } from '../../lib/hooks/useICP';
import { useICPAuth } from '../../lib/context/ICPAuthContext';

export default function BitPesaDemo() {
  const { 
    isAuthenticatedHelper, 
    getBtcPrice, 
    getHealth, 
    getBitcoinAddress, 
    getBitcoinNetworkInfo,
    demoTransactionWorkflow,
    getCyclesBalance,
    getPrincipal
  } = useICPHelpers();
  
  const { login, logout } = useICPAuth();
  
  const [btcPrice, setBtcPrice] = useState<string | null>(null);
  const [health, setHealth] = useState<string | null>(null);
  const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [cyclesBalance, setCyclesBalance] = useState<string | null>(null);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [demoResult, setDemoResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const isAuthenticated = isAuthenticatedHelper();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);
  
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get principal
      const principalObj = getPrincipal();
      if (principalObj) {
        setPrincipal(principalObj.toString());
      }
      
      // Get BTC price
      const priceResult = await getBtcPrice();
      if (priceResult.ok) {
        setBtcPrice(priceResult.ok);
      } else if (priceResult.err) {
        setError(priceResult.err);
      }
      
      // Get health
      const healthResult = await getHealth();
      setHealth(`Status: ${healthResult.status}, Time: ${new Date(Number(healthResult.timestamp) / 1000000).toLocaleString()}`);
      
      // Get Bitcoin address
      const addressResult = await getBitcoinAddress();
      if (addressResult.ok) {
        setBitcoinAddress(addressResult.ok);
      } else if (addressResult.err) {
        console.warn("Bitcoin address error:", addressResult.err);
      }
      
      // Get Bitcoin network info
      const networkInfoResult = await getBitcoinNetworkInfo();
      setNetworkInfo(networkInfoResult);
      
      // Get cycles balance
      const cycles = await getCyclesBalance();
      setCyclesBalance(cycles.toString());
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  const runDemo = async () => {
    setIsLoading(true);
    setDemoResult(null);
    
    try {
      const result = await demoTransactionWorkflow();
      if (result.ok) {
        setDemoResult(result.ok);
      } else if (result.err) {
        setError(result.err);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-3xl font-bold mb-4">BitPesa ICP Integration Demo</h1>
      
      {!isAuthenticated ? (
        <div className="mb-4 p-8 text-center">
          <p className="mb-6 text-lg">You need to authenticate with Internet Identity to use BitPesa services.</p>
          <button 
            onClick={() => login()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded text-lg font-medium"
          >
            Login with Internet Identity
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6 p-3 bg-green-50 rounded">
            <p className="text-green-700 font-semibold">✓ Authenticated with Internet Identity</p>
            <button
              onClick={() => logout()}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>
          
          {principal && (
            <div className="mb-6 p-3 bg-blue-50 rounded">
              <h2 className="font-semibold">Your Principal ID:</h2>
              <p className="bg-white p-2 rounded mt-1 text-sm font-mono break-all">
                {principal}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h2 className="font-bold text-xl mb-3">Canister Information</h2>
              
              <div className="mb-4">
                <h3 className="font-semibold">Canister Health:</h3>
                {health ? (
                  <p className="bg-gray-100 p-2 rounded mt-1 text-sm">{health}</p>
                ) : (
                  <p className="text-gray-500">Loading...</p>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold">Cycles Balance:</h3>
                {cyclesBalance ? (
                  <p className="bg-gray-100 p-2 rounded mt-1 text-sm font-mono">
                    {Number(cyclesBalance).toLocaleString()} cycles
                  </p>
                ) : (
                  <p className="text-gray-500">Loading...</p>
                )}
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h2 className="font-bold text-xl mb-3">BTC Integration</h2>
              
              <div className="mb-4">
                <h3 className="font-semibold">BTC Price:</h3>
                {btcPrice ? (
                  <pre className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-auto">
                    {btcPrice}
                  </pre>
                ) : (
                  <p className="text-gray-500">Loading...</p>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold">Bitcoin Address:</h3>
                {bitcoinAddress ? (
                  <p className="bg-gray-100 p-2 rounded mt-1 text-sm font-mono break-all">
                    {bitcoinAddress}
                  </p>
                ) : (
                  <p className="text-gray-500">Loading...</p>
                )}
              </div>
            </div>
            
            <div className="border rounded-lg p-4 md:col-span-2">
              <h2 className="font-bold text-xl mb-3">Bitcoin Network Info:</h2>
              {networkInfo ? (
                <pre className="bg-gray-100 p-3 rounded mt-1 text-sm overflow-auto max-h-60">
                  {JSON.stringify(networkInfo, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">Loading...</p>
              )}
            </div>
          </div>
          
          <div className="mt-8 border rounded-lg p-4">
            <h2 className="font-bold text-xl mb-3">Bitcoin Transaction Demo</h2>
            <p className="mb-4 text-gray-700">Run the demo workflow to test Bitcoin transaction building with the canister.</p>
            
            <button
              onClick={runDemo}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
              disabled={isLoading}
            >
              {isLoading ? 'Running Demo...' : 'Run Bitcoin Transaction Demo'}
            </button>
            
            {demoResult && (
              <div className="mt-4">
                <h3 className="font-semibold">Demo Result:</h3>
                <pre className="bg-gray-100 p-3 rounded mt-1 text-sm overflow-auto max-h-60 whitespace-pre-wrap">
                  {demoResult}
                </pre>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-center">
            <button
              onClick={fetchData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh All Data'}
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded">
          <p className="font-semibold">Error:</p>
          <p className="whitespace-pre-wrap">{error}</p>
        </div>
      )}
    </div>
  );
}
