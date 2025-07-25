# ICP Certificate Error Recovery Guide

This guide explains how to handle certificate verification errors in the BitPesa ICP integration, including the common "Invalid delegation: Invalid canister signature" error and intermittent signature verification failures.

## Understanding Certificate Errors

Common certificate errors include:

### 1. Invalid Delegation Errors
```
Invalid delegation: Invalid canister signature: IcCanisterSignature signature could not be verified
```

### 2. Intermittent Signature Verification Failures
```
Invalid certificate: Signature verification failed
```

### 3. Time Synchronization Issues
```
Ingress expiry error
Time synchronization failed
```

These errors typically occur due to:
- Time synchronization issues between your client and the ICP network
- Expired delegation certificates
- Network connectivity problems  
- Stale authentication state
- IndexedDB storage corruption
- Agent configuration issues

## Enhanced Automatic Recovery System

The system now includes multiple recovery strategies that adapt to different error patterns:

### 1. Smart Certificate Recovery (Recommended)

```typescript
import { smartCertificateRecovery } from '../lib/utils/icp-certificate-recovery';

function MyComponent() {
  const handleOperation = async () => {
    try {
      const result = await smartCertificateRecovery(async () => {
        const actor = await createActor(idlFactory, canisterId);
        return await actor.someMethod();
      }, identity, 'My Operation');
      
      return result;
    } catch (error) {
      console.error('Operation failed after smart recovery:', error);
    }
  };
}
```

### 2. Intermittent Error Handling

For the specific intermittent signature verification errors mentioned in ICP GitHub issues:

```typescript
import { handleIntermittentCertificateError } from '../lib/utils/icp-certificate-recovery';

const handleIntermittentError = async () => {
  try {
    const result = await handleIntermittentCertificateError(async () => {
      const actor = await createActor(idlFactory, canisterId);
      return await actor.queryMethod();
    }, identity, 5); // Max 5 attempts
    
    return result;
  } catch (error) {
    console.error('Intermittent error handling failed:', error);
  }
};
```

### 3. Using the Enhanced ICP Hook

The `useBitPesaLendingCanister` hook now uses smart recovery automatically:

```typescript
import { useBitPesaLendingCanister } from '../lib/hooks/useBitPesaLendingCanister';

function LendingComponent() {
  const { 
    getBtcUsdPrice,
    createBitcoinLoan,
    isLoading,
    error 
  } = useBitPesaLendingCanister();

  // All operations now use smart certificate recovery
  const handleGetPrice = async () => {
    const { data, error } = await getBtcUsdPrice();
    if (error) {
      console.error('Price fetch failed:', error);
      // Error message includes recovery guidance
    }
  };
}
```

## Certificate Diagnostics

Use the diagnostic tools to test and debug certificate issues:

### 1. Comprehensive Diagnostics

```typescript
import { runCertificateDiagnostics } from '../lib/utils/certificate-diagnostics';

const diagnostics = await runCertificateDiagnostics(identity);
console.log('Overall status:', diagnostics.overallStatus);
console.log('Recommendations:', diagnostics.recommendations);
```

### 2. Error Analysis

```typescript
import { analyzeCertificateError } from '../lib/utils/certificate-diagnostics';

try {
  // Your ICP operation
} catch (error) {
  const analysis = analyzeCertificateError(error);
  console.log('Error type:', analysis.errorType);
  console.log('Recommended recovery:', analysis.recommendedRecovery);
}
```

### 3. Generate Diagnostic Report

```typescript
import { generateDiagnosticReport } from '../lib/utils/certificate-diagnostics';

const report = await generateDiagnosticReport(identity);
console.log(report); // Detailed markdown report
```

## Recovery Strategies by Error Type

### Intermittent Signature Verification (Most Common)
- **Pattern**: `Invalid certificate: Signature verification failed`
- **Strategy**: Retry with exponential backoff
- **Implementation**: `handleIntermittentCertificateError`

### Delegation Errors
- **Pattern**: `Invalid delegation`
- **Strategy**: Full certificate recovery with cache clearing
- **Implementation**: `recoverFromCertificateError`

### Time Sync Issues
- **Pattern**: `Ingress expiry`, `Time synchronization`
- **Strategy**: Force time sync and agent refresh
- **Implementation**: Quick recovery with time sync

### Root Key Errors (Development)
- **Pattern**: `Unable to fetch root key`
- **Strategy**: Agent refresh with root key fetch
- **Implementation**: Agent reinitialization

## Testing Certificate Recovery

### 1. Test Intermittent Errors

```typescript
import { simulateIntermittentCertificateError } from '../lib/utils/certificate-diagnostics';

// Simulate the intermittent error pattern from GitHub issues
await simulateIntermittentCertificateError();
```

### 2. Test Recovery Strategies

```typescript
import { testRecoveryStrategies } from '../lib/utils/certificate-diagnostics';

const results = await testRecoveryStrategies(identity);
console.log('Best performing strategy:', results);
```

## Manual Recovery Options

### Quick Recovery
```typescript
import { quickCertificateRecovery } from '../lib/utils/icp-certificate-recovery';

await quickCertificateRecovery();
```

### Full Recovery
```typescript
import { recoverFromCertificateError } from '../lib/utils/icp-certificate-recovery';

await recoverFromCertificateError(identity, {
  maxRetries: 3,
  retryDelay: 2000,
  clearCacheFirst: true
});
```

### Emergency Recovery
```typescript
import { emergencyCertificateRecovery } from '../lib/utils/icp-certificate-recovery';

// Clears all storage and forces re-authentication
await emergencyCertificateRecovery();
```

## Browser Console Testing

For debugging in the browser console:

```javascript
// Quick diagnostics
window.icpDiagnostics = await import('./lib/utils/certificate-diagnostics');
const results = await window.icpDiagnostics.runCertificateDiagnostics();

// Test specific error patterns
const analysis = window.icpDiagnostics.analyzeCertificateError(yourError);

// Generate full report
const report = await window.icpDiagnostics.generateDiagnosticReport();
```

## Prevention Best Practices

1. **Time Synchronization**: Ensure system clock is accurate
2. **Storage Management**: Regularly clear IndexedDB for ICP apps
3. **Network Stability**: Use stable internet connection
4. **Agent Configuration**: Use appropriate ingress expiry times
5. **Error Handling**: Always wrap ICP calls in try-catch blocks
6. **User Guidance**: Provide clear error messages and recovery instructions

## Integration with Existing Systems

The certificate recovery system works alongside:
- Web3 wallet connections
- Supabase authentication
- Lightning Network integration
- CCIP cross-chain operations

All systems can operate simultaneously without conflicts.

## Troubleshooting Checklist

- [ ] Check system time synchronization
- [ ] Clear browser cache and localStorage
- [ ] Verify network connectivity
- [ ] Check IndexedDB storage quotas
- [ ] Confirm canister IDs are correct
- [ ] Test with different browsers
- [ ] Verify environment configuration

## Support and Debugging

If issues persist after following this guide:

1. Generate a diagnostic report
2. Check browser console for detailed error logs
3. Test with the diagnostic utilities
4. Consider emergency recovery if all else fails
