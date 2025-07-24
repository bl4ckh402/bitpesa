'use client';

import { useEffect } from 'react';
import { useICPAuth } from '../context/ICPAuthContext';
import { icpActorService, useICPActorService } from '../services/ICPActorService';
import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

export interface ICPHookReturn {
  // Auth related
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: Principal | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  
  // Actor service related
  createActor: <T>(idlFactory: any, canisterId: string | Principal) => T;
  createActorWithHttpDetails: <T>(idlFactory: any, canisterId: string | Principal) => T;
  actorService: typeof icpActorService;
}

/**
 * Main hook for ICP integration
 * Provides authentication and actor creation functionality
 */
export function useICP(): ICPHookReturn {
  const auth = useICPAuth();
  const actorService = useICPActorService();

  // Update actor service identity when auth state changes
  useEffect(() => {
    if (auth.identity) {
      actorService.updateIdentity(auth.identity);
    }
  }, [auth.identity, actorService]);

  // Convenience methods
  const createActor = <T>(idlFactory: any, canisterId: string | Principal): T => {
    return actorService.createActor<T>(idlFactory, canisterId);
  };

  const createActorWithHttpDetails = <T>(idlFactory: any, canisterId: string | Principal): T => {
    return actorService.createActorWithHttpDetails<T>(idlFactory, canisterId);
  };

  return {
    // Auth
    isAuthenticated: auth.isAuthenticated,
    identity: auth.identity,
    principal: auth.principal,
    login: auth.login,
    logout: auth.logout,
    isLoading: auth.isLoading,
    
    // Actor service
    createActor,
    createActorWithHttpDetails,
    actorService,
  };
}

// Additional hook for just authentication (lighter weight)
export function useICPIdentity() {
  const { isAuthenticated, identity, principal, login, logout, isLoading } = useICPAuth();
  
  return {
    isAuthenticated,
    identity,
    principal,
    principalId: principal?.toString() || null,
    login,
    logout,
    isLoading,
  };
}

export function useICPHelpers() {
  const { createActor, isAuthenticated, principal } = useICP();
  
  return {
    async greet(name: string): Promise<string> {
      if (!isAuthenticated) throw new Error('Not authenticated');
      const actor = createActor<any>(/* provide IDL factory and canister ID here */);
      return await actor.greet(name);
    },
    
    async getBtcPrice(): Promise<{ ok?: string; err?: string }> {
      if (!isAuthenticated) throw new Error('Not authenticated');
      const actor = createActor<any>(/* provide IDL factory and canister ID here */);
      const result = await actor.getBtcPrice();
      return result;
    },
    
    async getHealth(): Promise<{ status: string; timestamp: number }> {
      if (!isAuthenticated) throw new Error('Not authenticated');
      const actor = createActor<any>(/* provide IDL factory and canister ID here */);
      return await actor.health();
    },
    
    isAuthenticatedHelper(): boolean {
      return isAuthenticated;
    },
    
    getPrincipal(): Principal | null {
      return principal;
    }
  };
}
