'use client';

import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { getAgentHost, isLocalDevelopment } from '../config/icp-environment';

// Types for actor configuration
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

// Generic actor service class
export class ICPActorService {
  private agent: HttpAgent | null = null;
  private actors: Map<string, any> = new Map();

  constructor() {
    this.initializeAgent();
  }

  private initializeAgent(identity?: Identity) {
    const host = getAgentHost();

    this.agent = new HttpAgent({
      host,
      identity,
      fetch: typeof window !== 'undefined' ? window.fetch : undefined,
    });

    // Fetch root key for certificate validation during development
    if (isLocalDevelopment()) {
      this.agent.fetchRootKey().catch((err) => {
        console.warn(
          'Unable to fetch root key. Check to ensure that your local development environment is running'
        );
        console.error(err);
      });
    }
  }

  // Update the agent with a new identity
  public updateIdentity(identity: Identity | null) {
    if (identity) {
      this.initializeAgent(identity);
      // Clear existing actors so they'll be recreated with new identity
      this.actors.clear();
    }
  }

  // Create an actor for a specific canister
  public createActor<T>(
    idlFactory: any,
    canisterId: string | Principal,
    options: ActorConfig = {}
  ): T {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }

    const actorKey = `${canisterId.toString()}_${idlFactory.name || 'unknown'}`;
    
    if (this.actors.has(actorKey)) {
      return this.actors.get(actorKey) as T;
    }

    const actor = Actor.createActor(idlFactory, {
      agent: this.agent,
      canisterId,
      ...options.actorOptions,
    });

    this.actors.set(actorKey, actor);
    return actor as T;
  }

  // Get the current agent
  public getAgent(): HttpAgent | null {
    return this.agent;
  }

  // Clear all cached actors
  public clearActors() {
    this.actors.clear();
  }

  // Create actor with HTTP details (for boundary node HTTP headers)
  public createActorWithHttpDetails<T>(
    idlFactory: any,
    canisterId: string | Principal,
    options: ActorConfig = {}
  ): T {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }

    const actor = Actor.createActorWithHttpDetails(idlFactory, {
      agent: this.agent,
      canisterId,
      ...options.actorOptions,
    });

    return actor as T;
  }
}

// Singleton instance
export const icpActorService = new ICPActorService();

// Hook to use the actor service
export function useICPActorService() {
  return icpActorService;
}
