/**
 * ICP Certificate Recovery Utilities
 * 
 * This module provides utilities to handle ICP certificate verification errors,
 * particularly the "Invalid delegation: Invalid canister signature" error.
 * 
 * Common certificate errors occur due to:
 * - Time synchronization issues between client and ICP network
 * - Expired delegation certificates
 * - Network connectivity problems
 * - Stale authentication state
 */

import { icpActorService } from '../services/ICPActorService';
import { ICPErrorHandler } from './icp-error-handler';
import { Identity } from '@dfinity/agent';

export interface CertificateRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  forceReauthentication?: boolean;
  clearCacheFirst?: boolean;
}

/**
 * Recover from certificate verification errors
 * 
 * This function handles certificate verification errors by performing a comprehensive recovery process.
 * Enhanced based on ICP documentation and common patterns from GitHub issues.
 */
export async function recoverFromCertificateError(
  identity?: Identity,
  options: CertificateRecoveryOptions = {}
): Promise<void> {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    forceReauthentication = false,
    clearCacheFirst = true
  } = options;

  console.log('🔧 Starting certificate error recovery...');

  if (clearCacheFirst) {
    console.log('🧹 Clearing browser cache and local storage...');
    
    // Clear relevant localStorage items
    if (typeof window !== 'undefined') {
      try {
        // Clear Internet Identity related storage
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.includes('ic-identity') || 
          key.includes('delegation') || 
          key.includes('ic-keychain') ||
          key.includes('dfinity') ||
          key.includes('auth-client') ||
          key.includes('ic-agent')
        );
        
        keysToRemove.forEach(key => {
          console.log(`Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        });
        
        // Clear sessionStorage as well
        const sessionKeysToRemove = Object.keys(sessionStorage).filter(key => 
          key.includes('ic-identity') || 
          key.includes('delegation') ||
          key.includes('dfinity') ||
          key.includes('auth-client')
        );
        
        sessionKeysToRemove.forEach(key => {
          console.log(`Removing sessionStorage key: ${key}`);
          sessionStorage.removeItem(key);
        });

        // Clear IndexedDB entries (common for ICP apps)
        try {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name && (
              db.name.includes('dfinity') ||
              db.name.includes('ic-keyval') ||
              db.name.includes('internet-identity')
            )) {
              console.log(`Clearing IndexedDB: ${db.name}`);
              indexedDB.deleteDatabase(db.name);
            }
          }
        } catch (indexedDbError) {
          console.warn('Could not clear IndexedDB:', indexedDbError);
        }
        
      } catch (error) {
        console.warn('Failed to clear some storage items:', error);
      }
    }
  }

  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Recovery attempt ${attempt}/${maxRetries}...`);
      
      // Step 1: Force time synchronization (common issue mentioned in docs)
      try {
        await icpActorService.syncTime();
        console.log('✅ Time synchronization completed');
      } catch (timeError) {
        console.warn('⚠️ Time sync failed, continuing with recovery:', timeError);
      }
      
      // Step 2: Clear any stale actors
      icpActorService.clearActors();
      console.log('🧹 Cleared stale actors');
      
      // Step 3: Handle certificate error through the service
      await icpActorService.handleCertificateError(identity);
      console.log('🔧 Certificate error handling initiated');
      
      // Step 4: Add a small delay to allow network stabilization
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 5: Verify agent health with retry logic
      let healthCheckPassed = false;
      for (let healthAttempt = 1; healthAttempt <= 3; healthAttempt++) {
        try {
          const isHealthy = await icpActorService.checkAgentHealth();
          if (isHealthy) {
            healthCheckPassed = true;
            break;
          }
          console.warn(`Health check ${healthAttempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (healthError) {
          console.warn(`Health check attempt ${healthAttempt} error:`, healthError);
          if (healthAttempt === 3) throw healthError;
        }
      }
      
      if (!healthCheckPassed) {
        throw new Error('Agent health check failed after recovery');
      }
      
      console.log('✅ Certificate error recovery completed successfully');
      return;
      
    } catch (error) {
      lastError = error;
      console.warn(`❌ Recovery attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        const jitter = Math.random() * 1000; // Add jitter
        const totalDelay = delay + jitter;
        
        console.log(`⏳ Waiting ${Math.round(totalDelay)}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }
  }
  
  console.error('❌ Certificate recovery failed after all attempts');
  throw lastError;
}

/**
 * Check if an error is the specific certificate verification error
 * Enhanced to catch more certificate error patterns based on ICP documentation
 */
export function isCertificateVerificationError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString() || '';
  const errorString = errorMessage.toLowerCase();
  
  // Common certificate verification error patterns
  const certificateErrorPatterns = [
    // Delegation errors
    'invalid delegation',
    'invalid canister signature',
    'iccanistersignature signature could not be verified',
    'signature verification failed',
    
    // Time-related certificate errors
    'ingress expiry',
    'expired delegation',
    'time synchronization',
    
    // Agent/fetch errors that might indicate certificate issues
    'fetch root key',
    'unable to fetch root key',
    'agent error',
    
    // Common patterns from GitHub issues
    'invalid certificate',
    'certificate: signature verification failed',
    'threshold signature verification failed',
    'delegation chain'
  ];
  
  // Additional compound patterns
  const compoundPatterns = [
    () => errorString.includes('network error') && errorString.includes('certificate'),
    () => errorString.includes('connection refused') && errorString.includes('signature')
  ];
  
  return certificateErrorPatterns.some(pattern => 
    errorString.includes(pattern)
  ) || compoundPatterns.some(check => check());
}

/**
 * Comprehensive error handler for ICP certificate issues
 * 
 * This function should be used to wrap ICP calls that might fail due to certificate issues.
 */
export async function withCertificateRecovery<T>(
  operation: () => Promise<T>,
  identity?: Identity,
  options: CertificateRecoveryOptions = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.warn('Operation failed, checking for certificate error:', error);
    
    if (ICPErrorHandler.isDelegationError(error) || isCertificateVerificationError(error)) {
      console.log('Certificate error detected, attempting recovery...');
      
      try {
        await recoverFromCertificateError(identity, options);
        
        // Retry the operation after recovery
        console.log('Retrying operation after certificate recovery...');
        return await operation();
        
      } catch (recoveryError) {
        console.error('Certificate recovery failed:', recoveryError);
        
        // If recovery fails, throw the original error with additional context
        const errorMessage = error instanceof Error ? error.message : String(error);
        const enhancedError = new Error(
          `Operation failed due to certificate error, and recovery also failed. Original error: ${errorMessage}`
        );
        (enhancedError as any).originalError = error;
        (enhancedError as any).recoveryError = recoveryError;
        throw enhancedError;
      }
    }
    
    // If it's not a certificate error, just re-throw
    throw error;
  }
}

/**
 * Quick recovery function for the most common certificate errors
 */
export async function quickCertificateRecovery(): Promise<void> {
  console.log('🚀 Performing quick certificate recovery...');
  
  try {
    // Force refresh the agent
    await icpActorService.refreshAgent();
    
    // Verify the agent is working
    const isHealthy = await icpActorService.checkAgentHealth();
    if (!isHealthy) {
      throw new Error('Agent still unhealthy after quick recovery');
    }
    
    console.log('✅ Quick certificate recovery completed');
  } catch (error) {
    console.warn('Quick recovery failed, attempting full recovery...', error);
    await recoverFromCertificateError();
  }
}

/**
 * Emergency recovery function that clears all state and forces re-initialization
 */
export async function emergencyCertificateRecovery(): Promise<void> {
  console.log('🚨 Performing emergency certificate recovery...');
  
  try {
    // Clear all cached state
    icpActorService.clearActors();
    
    // Clear browser storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('Cleared all browser storage');
      } catch (error) {
        console.warn('Failed to clear browser storage:', error);
      }
    }
    
    // Force refresh with no identity (anonymous)
    await icpActorService.refreshAgent();
    
    console.log('🆘 Emergency recovery completed - user will need to re-authenticate');
    
  } catch (error) {
    console.error('Emergency recovery failed:', error);
    throw new Error('Emergency recovery failed. Please refresh the page and try again.');
  }
}

/**
 * Handles intermittent certificate errors (as mentioned in GitHub issues)
 * This function uses a different approach for handling sporadic failures
 */
export async function handleIntermittentCertificateError<T>(
  operation: () => Promise<T>,
  identity?: Identity,
  maxAttempts = 5
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // For intermittent errors, just retry with small delays first
      if (attempt > 1) {
        const delay = Math.min(1000 * attempt, 5000); // Cap at 5 seconds
        console.log(`🔄 Intermittent error retry ${attempt}/${maxAttempts}, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ Operation succeeded on attempt ${attempt}`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      
      if (isCertificateVerificationError(error)) {
        console.warn(`Certificate error on attempt ${attempt}:`, error);
        
        // On the last few attempts, try more aggressive recovery
        if (attempt >= maxAttempts - 1) {
          console.log('Attempting certificate recovery for intermittent error...');
          try {
            await quickCertificateRecovery();
          } catch (recoveryError) {
            console.warn('Quick recovery failed:', recoveryError);
          }
        }
      } else {
        // If it's not a certificate error, don't retry
        throw error;
      }
    }
  }
  
  console.error('❌ Intermittent certificate error handling failed after all attempts');
  throw lastError;
}

/**
 * Smart recovery function that adapts based on error patterns
 * Inspired by the testing patterns in the GitHub discussions
 */
export async function smartCertificateRecovery<T>(
  operation: () => Promise<T>,
  identity?: Identity,
  context = 'operation'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.warn(`${context} failed, analyzing error:`, error);
    
    if (isCertificateVerificationError(error)) {
      const errorMessage = (error as any)?.message || String(error);
      
      // Handle different types of certificate errors differently
      if (errorMessage.includes('Invalid certificate: Signature verification failed')) {
        // This is the specific intermittent error from GitHub issues
        console.log('Detected intermittent signature verification error, using specialized handling...');
        return await handleIntermittentCertificateError(operation, identity);
      }
      
      if (errorMessage.includes('Invalid delegation')) {
        // Standard delegation error - use full recovery
        console.log('Detected delegation error, using full recovery...');
        await recoverFromCertificateError(identity, {
          maxRetries: 2,
          retryDelay: 1500,
          clearCacheFirst: true
        });
        return await operation();
      }
      
      // For other certificate errors, try quick recovery first
      console.log('Detected certificate error, attempting quick recovery...');
      try {
        await quickCertificateRecovery();
        return await operation();
      } catch (quickRecoveryError) {
        console.warn('Quick recovery failed, attempting full recovery...');
        await recoverFromCertificateError(identity);
        return await operation();
      }
    }
    
    // Not a certificate error, just re-throw
    throw error;
  }
}
