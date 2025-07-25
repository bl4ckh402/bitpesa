'use client';

import { useEffect, useCallback } from 'react';
import { useICPAuth } from '../context/ICPAuthContext';
import { icpActorService, useICPActorService } from '../services/ICPActorService';
import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { CanisterIds } from '../config/icp-environment';
import { ICPErrorHandler, withICPErrorHandling } from '../utils/icp-error-handler';
import { withCertificateRecovery, quickCertificateRecovery } from '../utils/icp-certificate-recovery';

export interface ICPHookReturn {
  // Auth related
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: Principal | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  
  // Actor service related
  createActor: <T>(idlFactory: any, canisterId: string | Principal) => Promise<T>;
  createActorWithHttpDetails: <T>(idlFactory: any, canisterId: string | Principal) => Promise<T>;
  actorService: typeof icpActorService;
  
  // Certificate recovery utilities
  recoverFromCertificateError: () => Promise<void>;
  executeWithRecovery: <T>(operation: () => Promise<T>) => Promise<T>;
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

  // Convenience methods with error handling and automatic certificate recovery
  const createActor = useCallback(<T>(idlFactory: any, canisterId: string | Principal): Promise<T> => {
    return withCertificateRecovery(
      () => actorService.createActor<T>(idlFactory, canisterId),
      auth.identity || undefined,
      {
        maxRetries: 2,
        retryDelay: 1500,
        clearCacheFirst: false // Don't clear cache for routine operations
      }
    );
  }, [actorService, auth.identity]);

  const createActorWithHttpDetails = useCallback(<T>(idlFactory: any, canisterId: string | Principal): Promise<T> => {
    return withCertificateRecovery(
      () => actorService.createActor<T>(idlFactory, canisterId, {
        actorOptions: {
          httpDetails: true
        }
      }),
      auth.identity || undefined,
      {
        maxRetries: 2,
        retryDelay: 1500,
        clearCacheFirst: false
      }
    );
  }, [actorService, auth.identity]);

  // Certificate recovery utilities
  const recoverFromCertificateError = useCallback(async () => {
    // console.log('Manual certificate recovery initiated...');
    await quickCertificateRecovery();
  }, []);

  const executeWithRecovery = useCallback(<T>(operation: () => Promise<T>): Promise<T> => {
    return withCertificateRecovery(operation, auth.identity || undefined);
  }, [auth.identity]);

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
    
    // Certificate recovery
    recoverFromCertificateError,
    executeWithRecovery,
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

import { 
  BitpesaBackendService, 
  Result, 
  BitcoinAddressValidation, 
  BitcoinNetworkInfo,
  GetUtxosResponse,
  Satoshi
} from '../declarations/bitpesa_backend/types';
import { idlFactory } from '../declarations/bitpesa_backend/index';

export function useICPHelpers() {
  const { createActor, isAuthenticated, principal } = useICP();
  
  // Get the canister ID from environment or use the one from CanisterIds
  const BITPESA_CANISTER_ID = process.env.NEXT_PUBLIC_BACKEND_CANISTER_ID_LOCAL || "uxrrr-q7777-77774-qaaaq-cai";
  
  // Function to get the BitPesa backend actor
  const getBitpesaActor = async () => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    try {
      return await createActor<BitpesaBackendService>(idlFactory, BITPESA_CANISTER_ID);
    } catch (error) {
      console.error('Error creating BitPesa actor:', error);
      throw new Error(`Failed to create BitPesa actor: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return {
    async greet(name: string): Promise<string> {
      const actor = await getBitpesaActor();
      return await actor.greet(name);
    },
    
    async getBtcPrice(): Promise<Result<string>> {
      const actor = await getBitpesaActor();
      return await actor.getBtcPrice();
    },
    
    async getHealth(): Promise<{ status: string; timestamp: bigint }> {
      const actor = await getBitpesaActor();
      return await actor.health();
    },
    
    async getCyclesBalance(): Promise<bigint> {
      const actor = await getBitpesaActor();
      return await actor.getCyclesBalance();
    },
    
    async getBitcoinAddress(): Promise<Result<string>> {
      const actor = await getBitpesaActor();
      return await actor.get_canister_bitcoin_address();
    },
    
    async getBitcoinBalance(): Promise<Result<Satoshi>> {
      const actor = await getBitpesaActor();
      return await actor.get_canister_bitcoin_balance();
    },
    
    async getCanisterUtxos(): Promise<Result<GetUtxosResponse>> {
      const actor = await getBitpesaActor();
      return await actor.get_canister_utxos();
    },
    
    async getBitcoinNetworkInfo(): Promise<BitcoinNetworkInfo> {
      const actor = await getBitpesaActor();
      return await actor.get_bitcoin_network_info();
    },
    
    async createBitpesa(
      owner: Principal, 
      ckbtc: Principal, 
      stablecoin: Principal
    ): Promise<Principal> {
      const actor = await getBitpesaActor();
      return await actor.create_bitpesa(owner, ckbtc, stablecoin);
    },
    
    async getBitpesa(): Promise<Principal | null> {
      const actor = await getBitpesaActor();
      const result = await actor.get_bitpesa();
      return result.length ? result[0] : null; // Extract from optional result
    },
    
    async sendBitcoin(
      toAddress: string,
      amountSatoshi: bigint
    ): Promise<Result<string>> {
      const actor = await getBitpesaActor();
      return await actor.send_bitcoin(toAddress, amountSatoshi);
    },
    
    async validateBitcoinAddress(
      address: string
    ): Promise<Result<BitcoinAddressValidation>> {
      const actor = await getBitpesaActor();
      return await actor.validate_bitcoin_address(address);
    },
    
    async buildTransactionWithFeeEstimation(
      toAddress: string,
      amountSatoshi: bigint,
      feePriority: 'low' | 'medium' | 'high'
    ) {
      const actor = await getBitpesaActor();
      const priorityParam = feePriority === 'low' 
        ? { low: null } 
        : feePriority === 'medium' 
          ? { medium: null }
          : { high: null };
      return await actor.build_transaction_with_fee_estimation(toAddress, amountSatoshi, priorityParam);
    },
    
    async estimateTransactionFees(inputCount: number, outputCount: number) {
      const actor = await getBitpesaActor();
      return await actor.estimate_transaction_fees(BigInt(inputCount), BigInt(outputCount));
    },
    
    async buildOptimizedTransaction(
      toAddress: string,
      amountSatoshi: bigint,
      feeStrategy: 'economical' | 'standard' | 'priority',
      includeRbf: boolean
    ) {
      const actor = await getBitpesaActor();
      const strategyParam = feeStrategy === 'economical'
        ? { economical: null }
        : feeStrategy === 'standard'
          ? { standard: null }
          : { priority: null };
      return await actor.build_optimized_transaction(toAddress, amountSatoshi, strategyParam, includeRbf);
    },
    
    async demoTransactionWorkflow() {
      const actor = await getBitpesaActor();
      return await actor.demo_bitcoin_transaction_workflow();
    },
    
    isAuthenticatedHelper(): boolean {
      return isAuthenticated;
    },
    
    getPrincipal(): Principal | null {
      return principal;
    },

    async validateTransaction(transactionBytes: Uint8Array) {
      const actor = await getBitpesaActor();
      return await actor.validate_transaction(transactionBytes);
    },

    async buildBatchTransaction(
      recipients: Array<{ address: string; amount: bigint }>,
      feeStrategy: 'economical' | 'standard' | 'priority'
    ) {
      const actor = await getBitpesaActor();
      const strategyParam = feeStrategy === 'economical'
        ? { economical: null }
        : feeStrategy === 'standard'
          ? { standard: null }
          : { priority: null };
      return await actor.build_batch_transaction(recipients, strategyParam);
    }
  };
}
