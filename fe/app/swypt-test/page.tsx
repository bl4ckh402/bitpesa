'use client';

import React, { useState } from 'react';
import { SwyptOfframpCard } from '@/components/swypt/swypt-offramp-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Wallet, Phone, DollarSign, Network, Info, CheckCircle, XCircle } from 'lucide-react';
import { useSwypt } from '@/lib/hooks/use-swypt';

export default function SwyptTestPage() {
  const [demoWalletAddress, setDemoWalletAddress] = useState('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { loading, error, supportedAssets } = useSwypt();

  const handleOfframpSuccess = (data: any) => {
    setSuccessMessage(`Offramp initiated successfully! Order ID: ${data.orderID || 'N/A'}`);
    setErrorMessage('');
  };

  const handleOfframpError = (error: string) => {
    setErrorMessage(`Offramp error: ${error}`);
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Swypt Integration Test
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Test the Swypt SDK integration for seamless crypto-to-fiat conversions via M-Pesa
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary">Celo</Badge>
            <Badge variant="secondary">Polygon</Badge>
            <Badge variant="secondary">Base</Badge>
            <Badge variant="secondary">Lisk</Badge>
          </div>
        </div>

        {/* Status Messages */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="offramp" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="offramp">Offramp Demo</TabsTrigger>
            <TabsTrigger value="info">Integration Info</TabsTrigger>
            <TabsTrigger value="assets">Supported Assets</TabsTrigger>
          </TabsList>

          {/* Offramp Demo Tab */}
          <TabsContent value="offramp" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Demo Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Demo Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure demo parameters for testing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wallet">Demo Wallet Address</Label>
                    <Input
                      id="wallet"
                      value={demoWalletAddress}
                      onChange={(e) => setDemoWalletAddress(e.target.value)}
                      placeholder="0x..."
                    />
                    <p className="text-xs text-muted-foreground">
                      This simulates a connected wallet address
                    </p>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Demo Mode:</strong> This is a test environment. 
                      No real transactions will be processed.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Offramp Component */}
              <SwyptOfframpCard
                userAddress={demoWalletAddress}
                onSuccess={handleOfframpSuccess}
                onError={handleOfframpError}
                defaultNetwork="celo"
                defaultToken="USDT"
              />
            </div>

            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle>How the Offramp Process Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <Phone className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold">1. Enter Details</h3>
                    <p className="text-sm text-muted-foreground">
                      Provide your Kenyan phone number and amount
                    </p>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold">2. Get Quote</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive real-time exchange rates and fees
                    </p>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                      <Network className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="font-semibold">3. Send Crypto</h3>
                    <p className="text-sm text-muted-foreground">
                      Transfer crypto to Swypt's smart contract
                    </p>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <ArrowRight className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold">4. Receive M-Pesa</h3>
                    <p className="text-sm text-muted-foreground">
                      Get KES directly in your M-Pesa wallet
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Components Created:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• <code>SwyptSDK</code> - Core service class</li>
                      <li>• <code>useSwypt</code> - React hook for quotes & assets</li>
                      <li>• <code>useSwyptOfframp</code> - Hook for offramp operations</li>
                      <li>• <code>SwyptOfframpCard</code> - UI component</li>
                      <li>• API routes for server-side operations</li>
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Environment Variables Needed:</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="text-xs">
{`SWYPT_API_KEY=your_api_key
SWYPT_API_SECRET=your_api_secret
NEXT_PUBLIC_SWYPT_API_URL=https://pool.swypt.io/api`}
                      </pre>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Features Implemented:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✅ Real-time quotes</li>
                      <li>✅ Phone number validation</li>
                      <li>✅ Multi-network support</li>
                      <li>✅ Status monitoring</li>
                      <li>✅ Support ticket creation</li>
                      <li>✅ Error handling</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Smart Contract Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Contract Addresses:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Polygon:</span>
                        <code className="text-xs">0x5d3398142E393bB4BBFF6f67a3778322d3F9D90B</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Celo:</span>
                        <code className="text-xs">0x2816a02000B9845C464796b8c36B2D5D199525d5</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lisk:</span>
                        <code className="text-xs">0x2816a02000B9845C464796b8c36B2D5D199525d5</code>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Available Methods:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• <code>withdrawToEscrow()</code></li>
                      <li>• <code>withdrawWithPermit()</code></li>
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Integration Steps:</h4>
                    <ol className="text-sm space-y-1 text-muted-foreground">
                      <li>1. User approves token spend</li>
                      <li>2. Call contract withdrawal method</li>
                      <li>3. Submit transaction hash to Swypt API</li>
                      <li>4. Monitor M-Pesa transfer status</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Supported Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            {loading && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">Loading supported assets...</div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load supported assets: {error}
                </AlertDescription>
              </Alert>
            )}

            {supportedAssets && (
              <div className="space-y-6">
                {/* Networks */}
                <Card>
                  <CardHeader>
                    <CardTitle>Supported Networks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {supportedAssets.networks.map((network) => (
                        <Badge key={network} variant="outline">
                          {network.charAt(0).toUpperCase() + network.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Fiat Currencies */}
                <Card>
                  <CardHeader>
                    <CardTitle>Supported Fiat Currencies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {supportedAssets.fiat.map((currency) => (
                        <Badge key={currency} variant="secondary">
                          {currency}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Crypto Assets by Network */}
                <div className="space-y-4">
                  {Object.entries(supportedAssets.crypto).map(([network, tokens]) => (
                    <Card key={network}>
                      <CardHeader>
                        <CardTitle className="capitalize">
                          {network} Assets
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {tokens.map((token) => (
                            <div
                              key={token.address}
                              className="p-3 border rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{token.symbol}</span>
                                <Badge variant="outline">{token.decimals} decimals</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {token.name}
                              </p>
                              <p className="text-xs font-mono text-muted-foreground">
                                {token.address.slice(0, 10)}...{token.address.slice(-8)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!loading && !error && !supportedAssets && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    No assets data available. Check your API configuration.
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
