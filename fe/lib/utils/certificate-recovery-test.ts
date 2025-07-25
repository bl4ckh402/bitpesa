/**
 * Certificate Recovery Test Script
 * 
 * This script demonstrates how to test and use the certificate recovery system.
 * Run this in your browser console or integrate into your app for testing.
 */

import { icpActorService } from '../services/ICPActorService';
import { 
  recoverFromCertificateError,
  withCertificateRecovery,
  quickCertificateRecovery 
} from '../utils/icp-certificate-recovery';

// Test basic recovery
export async function testBasicRecovery() {
  console.log('🧪 Testing basic certificate recovery...');
  
  try {
    await quickCertificateRecovery();
    console.log('✅ Basic recovery test passed');
  } catch (error) {
    console.error('❌ Basic recovery test failed:', error);
  }
}

// Test recovery with actor creation
export async function testActorRecovery() {
  console.log('🧪 Testing actor creation with recovery...');
  
  try {
    const result = await withCertificateRecovery(async () => {
      // This would be your actual actor creation and call
      const healthCheck = await icpActorService.checkAgentHealth();
      if (!healthCheck) {
        throw new Error('Agent health check failed');
      }
      return { status: 'healthy' };
    });
    
    console.log('✅ Actor recovery test passed:', result);
  } catch (error) {
    console.error('❌ Actor recovery test failed:', error);
  }
}

// Test comprehensive recovery
export async function testComprehensiveRecovery() {
  console.log('🧪 Testing comprehensive certificate recovery...');
  
  try {
    await recoverFromCertificateError(undefined, {
      maxRetries: 2,
      retryDelay: 1000,
      clearCacheFirst: false
    });
    
    console.log('✅ Comprehensive recovery test passed');
  } catch (error) {
    console.error('❌ Comprehensive recovery test failed:', error);
  }
}

// Simulate the specific error you encountered
export async function simulateCertificateError() {
  console.log('🧪 Simulating certificate verification error...');
  
  const mockError = new Error(
    'Invalid delegation: Invalid canister signature: IcCanisterSignature signature could not be verified'
  );
  
  try {
    await withCertificateRecovery(async () => {
      throw mockError;
    });
  } catch (error: any) {
    console.log('✅ Certificate error simulation completed');
    console.log('Recovery was attempted for:', error.message);
  }
}

// Run all tests
export async function runAllRecoveryTests() {
  console.log('🚀 Starting certificate recovery tests...');
  
  await testBasicRecovery();
  await testActorRecovery();
  await testComprehensiveRecovery();
  await simulateCertificateError();
  
  console.log('🏁 All certificate recovery tests completed');
}

// Check current agent status
export async function checkAgentStatus() {
  console.log('🔍 Checking current agent status...');
  
  const agent = icpActorService.getAgent();
  console.log('Agent exists:', !!agent);
  
  if (agent) {
    try {
      const isHealthy = await icpActorService.checkAgentHealth();
      console.log('Agent is healthy:', isHealthy);
    } catch (error) {
      console.log('Agent health check failed:', error);
    }
  }
}

// Recovery utilities for manual testing
export const recoveryUtils = {
  testBasicRecovery,
  testActorRecovery,
  testComprehensiveRecovery,
  simulateCertificateError,
  runAllRecoveryTests,
  checkAgentStatus,
  
  // Direct access to recovery functions
  quickRecovery: quickCertificateRecovery,
  fullRecovery: recoverFromCertificateError,
  withRecovery: withCertificateRecovery,
  
  // Agent utilities
  refreshAgent: () => icpActorService.refreshAgent(),
  syncTime: () => icpActorService.syncTime(),
  clearActors: () => icpActorService.clearActors()
};

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).icpRecoveryUtils = recoveryUtils;
  console.log('🔧 ICP Recovery utilities available at: window.icpRecoveryUtils');
}
