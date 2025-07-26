'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowRight, Check, X, AlertCircle, Phone, DollarSign, Wallet } from 'lucide-react';
import { useSwypt, useSwyptOfframp } from '@/lib/hooks/use-swypt';
import { swyptSDK } from '@/lib/services/swypt-sdk';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SwyptOfframpCardProps {
  userAddress?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  defaultNetwork?: string;
  defaultToken?: string;
  defaultAmount?: string;
}

interface Quote {
  inputAmount: string;
  outputAmount: number;
  exchangeRate: number;
  fee: {
    amount: number;
    currency: string;
    details?: {
      feeInKES?: number;
      estimatedOutputKES?: number;
    };
  };
}

export function SwyptOfframpCard({
  userAddress,
  onSuccess,
  onError,
  defaultNetwork = 'celo',
  defaultToken = 'USDT',
  defaultAmount = ''
}: SwyptOfframpCardProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState(defaultAmount);
  const [selectedNetwork, setSelectedNetwork] = useState(defaultNetwork);
  const [selectedToken, setSelectedToken] = useState(defaultToken);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [step, setStep] = useState<'input' | 'quote' | 'processing' | 'success' | 'error'>('input');
  const [transactionHash, setTransactionHash] = useState('');
  const [orderID, setOrderID] = useState('');

  const { loading, error, supportedAssets, getQuote, clearError } = useSwypt();
  const {
    loading: offrampLoading,
    error: offrampError,
    orderStatus,
    processOfframp,
    checkOfframpStatus,
    createSupportTicket,
    startPolling,
    stopPolling
  } = useSwyptOfframp({
    orderID: orderID || undefined,
    pollInterval: 5000 // Poll every 5 seconds
  });

  // Clear errors when component unmounts or step changes
  useEffect(() => {
    return () => {
      clearError();
      stopPolling();
    };
  }, [clearError, stopPolling]);

  // Update amount when defaultAmount prop changes
  useEffect(() => {
    if (defaultAmount && defaultAmount !== amount) {
      setAmount(defaultAmount);
    }
  }, [defaultAmount]);

  // Handle phone number formatting
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setPhoneNumber(cleaned);
  };

  // Validate form
  const isFormValid = () => {
    return (
      swyptSDK.validateKenyanPhone(phoneNumber) &&
      amount &&
      parseFloat(amount) > 0 &&
      selectedNetwork &&
      selectedToken &&
      userAddress
    );
  };

  // Get quote
  const handleGetQuote = async () => {
    if (!isFormValid()) return;

    try {
      const tokenAddress = getTokenAddress(selectedNetwork, selectedToken);
      if (!tokenAddress) {
        onError?.('Token not found for selected network');
        return;
      }

      const quoteData = await getQuote({
        type: 'offramp',
        amount,
        fiatCurrency: 'KES',
        cryptoCurrency: selectedToken,
        network: selectedNetwork,
        category: 'B2C'
      });

      if (quoteData) {
        setQuote(quoteData.data);
        setStep('quote');
      }
    } catch (err) {
      console.error('Error getting quote:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to get quote');
    }
  };

  // Get token address for selected network and token
  const getTokenAddress = (network: string, token: string): string | null => {
    if (!supportedAssets) return null;
    
    const networkAssets = supportedAssets.crypto[network];
    if (!networkAssets) return null;
    
    const tokenData = networkAssets.find(asset => asset.symbol === token);
    return tokenData?.address || null;
  };

  // Process offramp (this would be called after user makes blockchain transaction)
  const handleProcessOfframp = async (txHash: string) => {
    if (!quote || !phoneNumber || !userAddress) return;

    setTransactionHash(txHash);
    setStep('processing');

    try {
      const tokenAddress = getTokenAddress(selectedNetwork, selectedToken);
      if (!tokenAddress) {
        throw new Error('Token address not found');
      }

      const result = await processOfframp({
        chain: selectedNetwork,
        hash: txHash,
        partyB: swyptSDK.formatKenyanPhone(phoneNumber),
        tokenAddress
      });

      if (result?.orderID) {
        setOrderID(result.orderID);
        startPolling();
        onSuccess?.(result);
      }
    } catch (err) {
      console.error('Error processing offramp:', err);
      setStep('error');
      onError?.(err instanceof Error ? err.message : 'Failed to process offramp');
    }
  };

  // Create support ticket
  const handleCreateTicket = async () => {
    const description = `Offramp issue for ${amount} ${selectedToken} to ${phoneNumber}`;
    
    const ticketData: any = {
      description,
      phone: swyptSDK.formatKenyanPhone(phoneNumber),
      amount,
      userAddress,
      symbol: selectedToken,
      chain: selectedNetwork
    };

    if (orderID) {
      ticketData.orderID = orderID;
    }

    if (transactionHash) {
      ticketData.tokenAddress = getTokenAddress(selectedNetwork, selectedToken);
    }

    await createSupportTicket(ticketData);
  };

  // Monitor order status
  useEffect(() => {
    if (orderStatus) {
      if (orderStatus.data.status === 'SUCCESS') {
        setStep('success');
        stopPolling();
      } else if (orderStatus.data.status === 'FAILED') {
        setStep('error');
        stopPolling();
      }
    }
  }, [orderStatus, stopPolling]);

  // Reset form
  const resetForm = () => {
    setPhoneNumber('');
    setAmount('');
    setQuote(null);
    setStep('input');
    setTransactionHash('');
    setOrderID('');
    clearError();
  };

  // Get available tokens for selected network
  const getAvailableTokens = () => {
    if (!supportedAssets || !selectedNetwork) return [];
    return supportedAssets.crypto[selectedNetwork] || [];
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-orange-500" />
          Crypto to M-Pesa
        </CardTitle>
        <CardDescription>
          Convert your crypto to Kenyan Shillings via M-Pesa
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {(error || offrampError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || offrampError}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Input Form */}
        {step === 'input' && (
          <div className="space-y-4">
            {/* Phone Number Input */}
            <div className="space-y-2">
              <Label htmlFor="phone">Kenyan Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678 or 254712345678"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              {phoneNumber && !swyptSDK.validateKenyanPhone(phoneNumber) && (
                <p className="text-sm text-destructive">
                  Please enter a valid Kenyan phone number
                </p>
              )}
            </div>

            {/* Network Selection */}
            <div className="space-y-2">
              <Label>Network</Label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedAssets?.networks.map((network) => (
                    <SelectItem key={network} value={network}>
                      {network.charAt(0).toUpperCase() + network.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Token Selection */}
            <div className="space-y-2">
              <Label>Token</Label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTokens().map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol} - {token.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Convert</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Wallet Address Display */}
            {userAddress && (
              <div className="space-y-2">
                <Label>Your Wallet</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleGetQuote}
              disabled={!isFormValid() || loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Quote
            </Button>
          </div>
        )}

        {/* Step 2: Quote Display */}
        {step === 'quote' && quote && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">You send:</span>
                <span className="font-semibold">{amount} {selectedToken}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">You receive:</span>
                <span className="font-semibold text-green-600">
                  KES {quote.outputAmount.toLocaleString()}
                </span>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Exchange Rate:</span>
                  <span>1 {selectedToken} = KES {quote.exchangeRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Fee:</span>
                  <span>{quote.fee.amount} {quote.fee.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee:</span>
                  <span>KES {quote.fee.details?.feeInKES || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Next Steps:</strong>
              </p>
              <ol className="text-sm text-blue-700 mt-2 space-y-1">
                <li>1. Confirm this quote</li>
                <li>2. Send {amount} {selectedToken} to the provided address</li>
                <li>3. Your M-Pesa will be processed automatically</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={() => {
                  // This would typically open a wallet modal or initiate transaction
                  // For now, we'll simulate with a demo hash
                  const demoHash = '0x' + Math.random().toString(16).substr(2, 40);
                  handleProcessOfframp(demoHash);
                }}
                className="flex-1"
              >
                Confirm & Send
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            </div>
            
            <div>
              <h3 className="font-semibold">Processing Your Transaction</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your crypto has been received. Processing M-Pesa transfer...
              </p>
            </div>

            {orderID && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Order ID:</p>
                <p className="font-mono text-sm">{orderID}</p>
              </div>
            )}

            {orderStatus && (
              <div className="text-left space-y-2">
                <Badge variant={
                  orderStatus.data.status === 'SUCCESS' ? 'default' :
                  orderStatus.data.status === 'FAILED' ? 'destructive' : 'secondary'
                }>
                  {orderStatus.data.status}
                </Badge>
                <p className="text-sm">{orderStatus.data.message}</p>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={handleCreateTicket}
              disabled={offrampLoading}
            >
              Need Help?
            </Button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-green-800">Transfer Complete!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                KES {quote?.outputAmount.toLocaleString()} has been sent to {phoneNumber}
              </p>
            </div>

            {orderStatus?.data.details.mpesaReceipt && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-700">M-Pesa Receipt:</p>
                <p className="font-mono text-sm text-green-800">
                  {orderStatus.data.details.mpesaReceipt}
                </p>
              </div>
            )}

            <Button onClick={resetForm} className="w-full">
              Make Another Transfer
            </Button>
          </div>
        )}

        {/* Step 5: Error */}
        {step === 'error' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-6 w-6 text-red-600" />
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-red-800">Transfer Failed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {orderStatus?.data.message || 'Something went wrong with your transfer'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCreateTicket}
                disabled={offrampLoading}
                className="flex-1"
              >
                {offrampLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Support
              </Button>
              <Button onClick={resetForm} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
