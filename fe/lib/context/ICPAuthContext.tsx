'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { getIdentityProviderUrl } from '../config/icp-environment';

interface ICPAuthContextType {
  authClient: AuthClient | null;
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: Principal | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const ICPAuthContext = createContext<ICPAuthContextType | undefined>(undefined);

interface ICPAuthProviderProps {
  children: ReactNode;
}

export function ICPAuthProvider({ children }: ICPAuthProviderProps) {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const client = await AuthClient.create({
        idleOptions: {
          // 10 minutes idle timeout
          idleTimeout: 1000 * 60 * 10,
          disableDefaultIdleCallback: true,
        },
      });

      setAuthClient(client);

      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);

      if (isAuthenticated) {
        const identity = client.getIdentity();
        const principal = identity.getPrincipal();
        
        setIdentity(identity);
        setPrincipal(principal);
      }
    } catch (error) {
      console.error('Failed to initialize ICP auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    if (!authClient) return;

    try {
      setIsLoading(true);
      
      await new Promise<void>((resolve, reject) => {
        console.log('Login to ICP'),
        authClient.login({
          // 7 days in nanoseconds
          maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
          // identityProvider: getIdentityProviderUrl(),
          onSuccess: () => {
            resolve();
          },
          onError: (error) => {
            console.error('Login failed:', error);
            reject(error);
          },
        });
      });

      // Update state after successful login
      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal();
      
      setIsAuthenticated(true);
      setIdentity(identity);
      setPrincipal(principal);
      
      console.log('ICP login successful, Principal:', principal.toString());
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!authClient) return;

    try {
      setIsLoading(true);
      await authClient.logout();
      
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      
      console.log('ICP logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: ICPAuthContextType = {
    authClient,
    isAuthenticated,
    identity,
    principal,
    login,
    logout,
    isLoading,
  };

  return (
    <ICPAuthContext.Provider value={value}>
      {children}
    </ICPAuthContext.Provider>
  );
}

export function useICPAuth() {
  const context = useContext(ICPAuthContext);
  if (context === undefined) {
    throw new Error('useICPAuth must be used within an ICPAuthProvider');
  }
  return context;
}
