'use client';

import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { getAgentHost, isLocalDevelopment } from '../config/icp-environment';

export interface ActorConfig {
  agentOptions?: {
    host?: string;
    fetch?: typeof fetch;
    identity?: Identity;
  };
  actorOptions?: {
    [key: string]: any;
  };
}

export class ICPActorService {
  private agent: HttpAgent | null = null;
  private actors: Map<string, any> = new Map();

  constructor() {
    this.initializeAgent().catch((err: any) => {
      console.error('Failed to initialize agent:', err);
    });
  }

  private async initializeAgent(identity?: Identity, retryAttempt = 0): Promise<void> {
    const host = getAgentHost();
    const boundFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : undefined;
    
    // Clear any existing agent first
    this.agent = null;
    
    // Use shorter expiry times to prevent certificate issues
    const ingressExpiryMinutes = isLocalDevelopment() ? 5 : 2;
    
    this.agent = new HttpAgent({
      host,
      identity,
      fetch: boundFetch,
      // Shorter ingress expiry to prevent certificate expiration
      ingressExpiryInMinutes: ingressExpiryMinutes,
      // Add retry configuration
      retryTimes: 2,
      // Add verification options
      verifyQuerySignatures: !isLocalDevelopment(),
      // Add call transform to handle certificate errors
      ...(typeof window !== 'undefined' && {
        callTransform: {
          request: {
            method: 'call',
            endpoint: 'call',
          },
          response: {
            method: 'call',
            endpoint: 'call',
          },
        },
      }),
    });

    if (isLocalDevelopment()) {
      try {
        await this.agent.fetchRootKey();
        // console.log('Root key fetched successfully for local development');
      } catch (err) {
        // console.warn('Unable to fetch root key. Check your local environment');
        console.error(err);
        
        // If we can't fetch root key in development, this might indicate a local replica issue
        if (retryAttempt < 2) {
          // console.log(`Retrying agent initialization (attempt ${retryAttempt + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 2000 + (retryAttempt * 1000)));
          return this.initializeAgent(identity, retryAttempt + 1);
        }
      }
    }

    try {
      if (this.agent) {
        await this.syncTime();
        // console.log('Agent initialized and time synced successfully');
      }
    } catch (err) {
      // console.warn('Initial time sync failed:', err);
      
      // If time sync fails and we're not in development, this could be a certificate issue
      if (!isLocalDevelopment() && retryAttempt < 2) {
        // console.log(`Retrying agent initialization due to time sync failure (attempt ${retryAttempt + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1500 + (retryAttempt * 1000)));
        return this.initializeAgent(identity, retryAttempt + 1);
      }
      // Don't throw here, let the application continue but log the issue
    }
  }
  
  public async syncTime(retries = 3, initialDelay = 1000) {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }
    
    let delay = initialDelay;
    let lastError;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await this.agent.syncTime();
        // console.log(`Time sync successful on attempt ${attempt + 1}`);
        return;
      } catch (err) {
        lastError = err;
        console.warn(`Time sync attempt ${attempt + 1} failed:`, err);
        
        if (attempt < retries - 1) {
          const jitter = Math.random() * 500; // Add jitter to prevent synchronization
          // console.log(`Retrying in ${delay + jitter}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
          delay *= 2; // Exponential backoff
        }
      }
    }
    
    console.error(`Time sync failed after ${retries} attempts`, lastError);
    throw lastError;
  }

  public async updateIdentity(identity: Identity | null) {
    // console.log('Updating identity...', identity ? 'authenticated' : 'anonymous');
    
    if (identity) {
      // Clear actors to force recreation with new identity
      this.actors.clear();
      await this.initializeAgent(identity);
    } else {
      // For anonymous identity, reinitialize without identity
      this.actors.clear();
      await this.initializeAgent();
    }
  }

  /**
   * Force refresh of the agent and clear all cached actors
   * This is useful when encountering certificate or delegation errors
   */
  public async refreshAgent(identity?: Identity) {
    // console.log('Force refreshing agent and clearing cached actors...');
    this.actors.clear();
    this.agent = null;
    await this.initializeAgent(identity);
  }

  /**
   * Check if the current agent is healthy and can make calls
   */
  public async checkAgentHealth(): Promise<boolean> {
    if (!this.agent) {
      return false;
    }

    try {
      await this.syncTime();
      return true;
    } catch (error) {
      console.warn('Agent health check failed:', error);
      return false;
    }
  }

  /**
   * Execute an actor call with automatic certificate error recovery
   */
  public async executeWithRecovery<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} failed:`, error);
        
        if (this.isCertificateError(error) && attempt < maxRetries - 1) {
          // console.log('Certificate error detected, refreshing agent...');
          await this.refreshAgent();
          
          // Add exponential backoff with jitter
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          const jitter = Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
        } else if (attempt < maxRetries - 1) {
          // For non-certificate errors, just wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw lastError;
  }

  public async createActor<T>(
    idlFactory: any,
    canisterId: string | Principal,
    options: ActorConfig = {}
  ): Promise<T> {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }

    const actorKey = `${canisterId.toString()}_${idlFactory.name || 'unknown'}`;
    
    // Always sync time before creating actors to prevent certificate issues
    try {
      await this.syncTime();
    } catch (err) {
      console.warn('Time sync failed before actor creation:', err);
      // Continue anyway, but the call might fail
    }
    
    if (this.actors.has(actorKey)) {
      return this.actors.get(actorKey) as T;
    }

    try {
      const actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId,
        ...options.actorOptions,
      });

      this.actors.set(actorKey, actor);
      // console.log(`Actor created successfully for canister: ${canisterId.toString()}`);
      return actor as T;
    } catch (error) {
      console.error('Failed to create actor:', error);
      
      // Check if this is a certificate/delegation error
      if (this.isCertificateError(error)) {
        // console.log('Certificate error detected, reinitializing agent...');
        // Clear actors and reinitialize agent
        this.actors.clear();
        await this.initializeAgent();
        
        // Retry actor creation once
        try {
          const actor = Actor.createActor(idlFactory, {
            agent: this.agent,
            canisterId,
            ...options.actorOptions,
          });

          this.actors.set(actorKey, actor);
          return actor as T;
        } catch (retryError) {
          console.error('Actor creation failed after agent reinitializtion:', retryError);
          throw retryError;
        }
      }
      throw error;
    }
  }

  private isCertificateError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString() || '';
    const errorString = errorMessage.toLowerCase();
    
    return (
      errorString.includes('delegation') ||
      errorString.includes('certificate') ||
      errorString.includes('signature') ||
      errorString.includes('threshold') ||
      errorString.includes('verification failed') ||
      errorString.includes('invalid canister signature') ||
      errorString.includes('expired') ||
      errorString.includes('iccanistersignature') ||
      errorString.includes('threshold signature') ||
      (errorString.includes('time') && errorString.includes('sync'))
    );
  }

  /**
   * Handle certificate verification failures by refreshing the entire authentication flow
   */
  public async handleCertificateError(identity?: Identity): Promise<void> {
    // console.log('Handling certificate verification error...');
    
    try {
      // Clear all cached state
      this.actors.clear();
      this.agent = null;
      
      // Wait a moment to let any pending operations complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reinitialize with fresh agent
      await this.initializeAgent(identity);
      
      // Force a time sync to ensure clock synchronization
      await this.syncTime(3, 2000);
      
      // console.log('Certificate error recovery completed successfully');
    } catch (error) {
      console.error('Failed to recover from certificate error:', error);
      throw error;
    }
  }

  public getAgent(): HttpAgent | null {
    return this.agent;
  }

  public clearActors() {
    this.actors.clear();
  }

  public startPeriodicTimeSync(intervalMs = 60000) {
    if (typeof window !== 'undefined') {
      this.stopPeriodicTimeSync();
      
      // Initial sync with jittered delay
      const initialJitter = Math.random() * 5000;
      setTimeout(() => {
        this.syncTime().catch(console.warn);
      }, initialJitter);
      
      this._timeSyncInterval = setInterval(() => {
        this.syncTime().catch(console.warn);
      }, intervalMs);
    }
  }
  
  public stopPeriodicTimeSync() {
    if (this._timeSyncInterval) {
      clearInterval(this._timeSyncInterval);
      this._timeSyncInterval = undefined;
    }
  }
  
  public dispose() {
    this.stopPeriodicTimeSync();
    this.clearActors();
    this.agent = null;
  }

  private _timeSyncInterval: ReturnType<typeof setInterval> | undefined;
}

export const icpActorService = new ICPActorService();

if (typeof window !== 'undefined') {
  // Reduced frequency to 60 seconds with jitter
  icpActorService.startPeriodicTimeSync(60000);
  
  window.addEventListener('DOMContentLoaded', () => {
    // Jittered initial sync
    const delay = Math.random() * 3000;
    setTimeout(() => {
      icpActorService.syncTime().catch(console.warn);
    }, delay);
  });
}

export function useICPActorService() {
  return icpActorService;
}