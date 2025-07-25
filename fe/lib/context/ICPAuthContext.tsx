'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { getIdentityProviderUrl } from "../config/icp-environment";

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
    
    // Set up delegation refresh timer
    const refreshInterval = setInterval(async () => {
      if (authClient && isAuthenticated) {
        try {
          const isStillAuthenticated = await authClient.isAuthenticated();
          if (!isStillAuthenticated) {
            // console.log('Authentication expired, logging out...');
            await logout();
          }
        } catch (error) {
          console.error('Error checking authentication status:', error);
        }
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(refreshInterval);
    };
  }, [authClient, isAuthenticated]);

  const initAuth = async () => {
    try {
      // console.log('Initializing ICP authentication...');
      
      const client = await AuthClient.create({
        idleOptions: {
          // 8 minutes idle timeout (reduced from 10 to be safer)
          idleTimeout: 1000 * 60 * 8,
          disableDefaultIdleCallback: true,
          onIdle: async () => {
            // console.log('User idle detected, logging out...');
            await logout();
          },
        },
      });

      setAuthClient(client);

      const isAuthenticated = await client.isAuthenticated();
      // console.log('Authentication status:', isAuthenticated);
      
      setIsAuthenticated(isAuthenticated);

      if (isAuthenticated) {
        const identity = client.getIdentity();
        const principal = identity.getPrincipal();
        
        // console.log('User authenticated with principal:', principal.toString());
        
        setIdentity(identity);
        setPrincipal(principal);
      } else {
        // console.log('User not authenticated');
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
      // console.log('Starting ICP login process...');
      
      await new Promise<void>((resolve, reject) => {
        authClient.login({
          // 4 hours in nanoseconds (reduced from 7 days to prevent delegation issues)
          maxTimeToLive: BigInt(4 * 60 * 60 * 1000 * 1000 * 1000),
          identityProvider: getIdentityProviderUrl(),
          onSuccess: () => {
            console.log('Login callback: success');
            resolve();
          },
          onError: (error) => {
            console.error('Login callback: error', error);
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
      throw error; // Re-throw to let the UI handle the error
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
