# ICP Identity Integration

This document describes how to use the Internet Computer Protocol (ICP) identity integration in our Next.js application.

## Overview

The ICP integration provides:
- Authentication with Internet Identity
- Actor creation for canister interactions  
- Session management and persistence
- TypeScript support

## Quick Start

### 1. Environment Setup

Copy the environment template and configure our canister IDs:

```bash
cp .env.icp.example .env.local
```

Edit `.env.local` with our actual canister IDs:

```env
NEXT_PUBLIC_BACKEND_CANISTER_ID=u6s2n-gx777-77774-qaaba-cai
NEXT_PUBLIC_INTERNET_IDENTITY_CANISTER_ID=uxrrr-q7777-77774-qaaaq-cai
```

### 2. Auto-generate Environment from dfx

If you're using dfx, you can auto-generate environment files:

```bash
npm run setup-icp
```

This will read our `canister_ids.json` files and generate the appropriate `.env` files.

### 3. Basic Usage

#### Authentication Only

```tsx
import { useICPIdentity } from '@/lib/hooks/useICP';

function MyComponent() {
  const { isAuthenticated, principalId, login, logout } = useICPIdentity();
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Connected as: {principalId}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={login}>Connect ICP</button>
      )}
    </div>
  );
}
```

#### With Actor Creation

```tsx
import { useICP } from '@/lib/hooks/useICP';
// import { idlFactory } from './path/to/our/canister.did.js';

function MyComponent() {
  const { createActor, isAuthenticated } = useICP();
  
  const callCanister = async () => {
    if (!isAuthenticated) return;
    
    // Replace with our actual IDL factory and canister ID
    // const actor = createActor(idlFactory, 'our_canister_id');
    // const result = await actor.my_method();
    console.log('Actor service ready for canister calls');
  };
  
  return (
    <button onClick={callCanister} disabled={!isAuthenticated}>
      Call Canister
    </button>
  );
}
```

### 4. Using the Wallet Connect Component

The integration includes pre-built components:

```tsx
import { ICPWalletConnect, ICPLoginButton } from '@/components/icp/ICPWalletConnect';

// Full featured with dropdown
<ICPWalletConnect />

// Simple login/logout button
<ICPLoginButton variant="outline" />
```

## Components

### ICPWalletConnect

A full-featured wallet connection component with dropdown menu.

**Props:**
- `variant`: Button variant (default, outline, ghost, etc.)
- `size`: Button size (default, sm, lg, icon)
- `showDropdown`: Whether to show dropdown menu (default: true)
- `className`: Additional CSS classes

### ICPLoginButton

A simple login/logout button without dropdown functionality.

**Props:**
- `variant`: Button variant
- `size`: Button size  
- `className`: Additional CSS classes

## Hooks

### useICPIdentity()

Lightweight hook for authentication only.

**Returns:**
- `isAuthenticated`: boolean
- `identity`: Identity object
- `principal`: Principal object
- `principalId`: string
- `login()`: function
- `logout()`: function
- `isLoading`: boolean

### useICP()

Full-featured hook with actor service access.

**Returns:**
- All properties from `useICPIdentity()`
- `createActor<T>(idlFactory, canisterId)`: function
- `createActorWithHttpDetails<T>(idlFactory, canisterId)`: function
- `actorService`: ICPActorService instance

## Services

### ICPActorService

Service class for managing actors and HTTP agents.

**Methods:**
- `createActor<T>(idlFactory, canisterId, options?)`: Create an actor
- `createActorWithHttpDetails<T>(idlFactory, canisterId, options?)`: Create actor with HTTP details
- `updateIdentity(identity)`: Update the agent identity
- `getAgent()`: Get the current HTTP agent
- `clearActors()`: Clear cached actors

## Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_BACKEND_CANISTER_ID=our_backend_canister_id
NEXT_PUBLIC_INTERNET_IDENTITY_CANISTER_ID=uxrrr-q7777-77774-qaaaq-cai

# Optional
NEXT_PUBLIC_DFX_NETWORK=local
NEXT_PUBLIC_IDENTITY_PROVIDER_URL=https://identity.ic0.app/#authorize
```

### Network Configuration

The integration automatically detects the environment:

- **Production**: Uses `https://icp-api.io` and `https://identity.ic0.app`
- **Development**: Uses `http://127.0.0.1:4943` and local Internet Identity

## Advanced Usage

### Custom Storage

The auth client uses IndexedDB by default. You can provide custom storage:

```tsx
import { AuthClient } from '@dfinity/auth-client';

const authClient = await AuthClient.create({
  storage: new CustomStorage(), // Implement AuthClientStorage interface
  keyType: 'Ed25519', // Use if storage only supports strings
});
```

### Session Management

Configure idle management:

```tsx
const authClient = await AuthClient.create({
  idleOptions: {
    idleTimeout: 1000 * 60 * 10, // 10 minutes
    disableDefaultIdleCallback: true,
  },
});
```

### Actor Configuration

Pass additional options when creating actors:

```tsx
const actor = createActor(idlFactory, canisterId, {
  actorOptions: {
    // Actor-specific options
  },
  agentOptions: {
    // Agent-specific options
  },
});
```

## Testing

Visit `/testing/icp` to test the integration:

```bash
npm run dev
# Navigate to http://localhost:3000/testing/icp
```

This page provides:
- Connection status
- Principal ID display
- Code examples
- Interactive testing

## Troubleshooting

### Common Issues

1. **"Canister ID not found"**
   - Check our `.env.local` file
   - Ensure canister IDs are correctly formatted
   - Run `npm run setup-icp` if using dfx

2. **"Unable to fetch root key"**
   - Ensure our local dfx environment is running
   - Check that the network configuration is correct

3. **Authentication window doesn't open**
   - Check browser popup blockers
   - Verify identity provider URL is correct

### Debug Mode

Enable debug logging in development:

```tsx
console.log('ICP Environment:', {
  network: getCurrentNetwork(),
  host: getAgentHost(),
  canisters: getICPEnvironment().canisters,
});
```

## Integration with Existing Wallet Systems

The ICP integration is designed to work alongside existing Web3 wallet connections. Both systems can be used simultaneously in our application.

## Security Considerations

- Never expose private keys or sensitive canister methods
- Validate all user inputs before making canister calls
- Use appropriate session timeouts for our use case
- Consider implementing additional authorization layers for sensitive operations

## Further Reading

- [Internet Computer Documentation](https://internetcomputer.org/docs)
- [ICP JavaScript Agent Documentation](https://agent-js.icp.xyz/)
- [Internet Identity Documentation](https://internetcomputer.org/docs/current/tokenomics/identity-auth/internet-identity)
