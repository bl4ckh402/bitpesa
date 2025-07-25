# ICP Certificate Error Recovery Guide

This guide explains how to handle the "Invalid delegation: Invalid canister signature" error that you encountered, and provides tools for automatic recovery.

## Understanding the Error

The error you encountered:
```
Invalid delegation: Invalid canister signature: IcCanisterSignature signature could not be verified
```

This typically occurs due to:
- Time synchronization issues between your client and the ICP network
- Expired delegation certificates
- Network connectivity problems  
- Stale authentication state

## Automatic Recovery

The system now includes automatic certificate recovery that handles these errors transparently:

### 1. Using the Enhanced ICP Hook

```typescript
import { useICP } from '../lib/hooks/useICP';

function MyComponent() {
  const { 
    createActor, 
    executeWithRecovery, 
    recoverFromCertificateError 
  } = useICP();

  // This automatically handles certificate errors
  const handleActorCall = async () => {
    try {
      const actor = await createActor(idlFactory, canisterId);
      const result = await actor.someMethod();
      return result;
    } catch (error) {
      // Certificate errors are automatically recovered
      console.error('Operation failed:', error);
    }
  };

  // Or use executeWithRecovery for custom operations
  const handleCustomOperation = async () => {
    try {
      const result = await executeWithRecovery(async () => {
        const actor = await createActor(idlFactory, canisterId);
        return await actor.complexOperation();
      });
      return result;
    } catch (error) {
      console.error('Operation failed after recovery attempts:', error);
    }
  };

  // Manual recovery if needed
  const handleManualRecovery = async () => {
    try {
      await recoverFromCertificateError();
      console.log('Recovery completed successfully');
    } catch (error) {
      console.error('Manual recovery failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleActorCall}>
        Make Actor Call (Auto Recovery)
      </button>
      <button onClick={handleCustomOperation}>
        Custom Operation with Recovery
      </button>
      <button onClick={handleManualRecovery}>
        Manual Recovery
      </button>
    </div>
  );
}
```

### 2. Using Direct Recovery Functions

```typescript
import { 
  recoverFromCertificateError,
  withCertificateRecovery,
  quickCertificateRecovery,
  emergencyCertificateRecovery 
} from '../lib/utils/icp-certificate-recovery';

// Wrap any ICP operation with automatic recovery
async function makeICPCall() {
  return await withCertificateRecovery(async () => {
    const actor = await icpActorService.createActor(idlFactory, canisterId);
    return await actor.getData();
  });
}

// Quick recovery for common issues
async function handleCertificateIssue() {
  try {
    await quickCertificateRecovery();
    console.log('Quick recovery successful');
  } catch (error) {
    console.log('Quick recovery failed, trying full recovery...');
    await recoverFromCertificateError();
  }
}

// Emergency recovery (clears all state)
async function emergencyRecover() {
  await emergencyCertificateRecovery();
  // User will need to re-authenticate after this
}
```

## Configuration Options

You can customize the recovery behavior:

```typescript
const recoveryOptions = {
  maxRetries: 3,           // Number of retry attempts
  retryDelay: 2000,        // Base delay between retries (ms)
  forceReauthentication: false,  // Force user to re-authenticate
  clearCacheFirst: true    // Clear browser cache before recovery
};

await recoverFromCertificateError(identity, recoveryOptions);
```

## Error Detection

The system automatically detects certificate errors, but you can also check manually:

```typescript
import { isCertificateVerificationError } from '../lib/utils/icp-certificate-recovery';
import { ICPErrorHandler } from '../lib/utils/icp-error-handler';

try {
  // Your ICP operation
} catch (error) {
  if (isCertificateVerificationError(error)) {
    console.log('This is the specific certificate verification error you encountered');
  }
  
  if (ICPErrorHandler.isDelegationError(error)) {
    console.log('This is a general delegation/certificate error');
  }
  
  // Get user-friendly error message
  const message = ICPErrorHandler.getUserFriendlyMessage(error);
  console.log('User message:', message);
  
  // Get suggested actions
  const actions = ICPErrorHandler.getSuggestedActions(error);
  console.log('Suggested actions:', actions);
}
```

## Best Practices

### 1. Use the Enhanced Hook
Always use the `useICP()` hook which includes automatic recovery:

```typescript
const { createActor } = useICP();
// This handles certificate errors automatically
```

### 2. Wrap Critical Operations
For important operations, use explicit recovery wrapping:

```typescript
const criticalOperation = await withCertificateRecovery(
  () => performImportantTask(),
  identity,
  { maxRetries: 5, clearCacheFirst: true }
);
```

### 3. Handle Recovery Failures Gracefully
```typescript
try {
  await withCertificateRecovery(() => myOperation());
} catch (error) {
  // Show user-friendly error message
  const message = ICPErrorHandler.getUserFriendlyMessage(error);
  showErrorToUser(message);
  
  // Optionally suggest manual actions
  const actions = ICPErrorHandler.getSuggestedActions(error);
  showSuggestedActions(actions);
}
```

### 4. Monitor Recovery Events
```typescript
// The recovery functions log detailed information
// Monitor browser console for recovery progress
```

## Troubleshooting

If you continue to see certificate errors:

1. **Check your system time** - Ensure it's synchronized
2. **Clear browser data** - Use `emergencyCertificateRecovery()`
3. **Check network connectivity** - Ensure stable internet connection
4. **Re-authenticate** - Log out and log back in
5. **Update your ICP agent** - Ensure you're using the latest version

## Recovery Logging

The recovery system provides detailed logging:

```
🔧 Starting certificate error recovery...
🧹 Clearing browser cache and local storage...
🔄 Recovery attempt 1/3...
✅ Certificate error recovery completed successfully
```

Watch the browser console for these messages to understand what's happening during recovery.

## Integration with Your App

The enhanced `ICPActorService` now includes:

- Automatic retry logic with exponential backoff
- Certificate error detection and recovery
- Time synchronization improvements  
- Agent health checking
- Comprehensive error handling

All existing code will benefit from these improvements automatically.
