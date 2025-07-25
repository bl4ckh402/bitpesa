'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useICP, useICPIdentity } from '@/lib/hooks/useICP';
import { ICPWalletConnect, ICPLoginButton } from '@/components/icp/ICPWalletConnect';
import { Copy, CheckCircle, AlertCircle, User, Shield, Key } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function ICPTestingPage() {
  const [copied, setCopied] = useState(false);
  const { 
    isAuthenticated, 
    identity, 
    principal, 
    principalId, 
    login, 
    logout, 
    isLoading 
  } = useICPIdentity();
  
  const { createActor, actorService } = useICP();

  const handleCopyPrincipal = async () => {
    if (principalId) {
      await navigator.clipboard.writeText(principalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const testActorCreation = () => {
    try {
      // Example of how you would create an actor
      // Replace with your actual IDL factory and canister ID
      console.log('Actor service available:', !!actorService);
      console.log('Identity available:', !!identity);
      
      // Example usage:
      // const actor = createActor(your_idl_factory, 'your_canister_id');
      alert('Actor service is ready! Check console for details.');
    } catch (error) {
      console.error('Actor creation test failed:', error);
      alert('Actor creation test failed. Check console for details.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">ICP Identity Integration Test</h1>
        <p className="text-slate-300 max-w-2xl mx-auto">
          Test the Internet Computer Protocol (ICP) identity integration. Connect your identity
          to interact with canisters on the IC network.
        </p>
      </div>

      {/* Connection Status Card */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Current state of your ICP identity connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isLoading ? "Connecting..." : isAuthenticated ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          
          {isAuthenticated && principalId && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium">Principal ID:</span>
                <div className="flex items-center gap-2 p-2 bg-slate-900 rounded border">
                  <code className="text-xs text-green-400 flex-1 break-all">
                    {principalId}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyPrincipal}
                    className="h-6 w-6 p-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
          
          <Separator />
          <div className="flex gap-2">
            <ICPWalletConnect variant="outline" />
            {isAuthenticated && (
              <Button
                variant="secondary"
                onClick={testActorCreation}
                className="flex items-center gap-2"
              >
                <Key className="h-4 w-4" />
                Test Actor Service
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integration Examples */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Authentication Example */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle>Authentication Example</CardTitle>
            <CardDescription>
              Basic login/logout functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Simple Button:</h4>
              <ICPLoginButton variant="outline" />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">With Dropdown:</h4>
              <ICPWalletConnect variant="secondary" />
            </div>
          </CardContent>
        </Card>

        {/* Usage Information */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle>Usage Information</CardTitle>
            <CardDescription>
              How to use the ICP integration in your components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>useICPIdentity():</strong> For authentication only<br/>
                <strong>useICP():</strong> For full actor service access
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Available hooks:</h4>
              <ul className="text-xs space-y-1 text-slate-300">
                <li>• <code>isAuthenticated</code> - boolean</li>
                <li>• <code>principal</code> - Principal object</li>
                <li>• <code>principalId</code> - string</li>
                <li>• <code>identity</code> - Identity object</li>
                <li>• <code>login()</code> - function</li>
                <li>• <code>logout()</code> - function</li>
                <li>• <code>createActor()</code> - function</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code Examples */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>
            How to use the ICP integration in your React components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Basic Authentication:</h4>
            <pre className="text-xs bg-slate-900 p-3 rounded border overflow-x-auto">
              <code className="text-green-400">{`import { useICPIdentity } from '@/lib/hooks/useICP';

function MyComponent() {
  const { isAuthenticated, principalId, login, logout } = useICPIdentity();
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Connected as: {principalId}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={login}>Connect ICP</button>
      )}
    </div>
  );
}`}</code>
            </pre>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Actor Creation:</h4>
            <pre className="text-xs bg-slate-900 p-3 rounded border overflow-x-auto">
              <code className="text-green-400">{`import { useICP } from '@/lib/hooks/useICP';

function MyComponent() {
  const { createActor, isAuthenticated } = useICP();
  
  const callCanister = async () => {
    if (!isAuthenticated) return;
    
    const actor = createActor(idlFactory, canisterId);
    const result = await actor.my_method();
    console.log(result);
  };
  
  return <button onClick={callCanister}>Call Canister</button>;
}`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
