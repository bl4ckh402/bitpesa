# BitPesa Chain Fusion - Production Deployment Guide

## Overview

BitPesa Chain Fusion is a production-ready lending platform that uses the Internet Computer's Chain Fusion technology to enable cross-chain Bitcoin-to-USDC loans. This system allows users to deposit Bitcoin as collateral and receive USDC on Ethereum addresses through automatic threshold ECDSA signing.

## Architecture

### Core Components

1. **BitPesaChainFusionProduction.mo** - Main lending logic with production Chain Fusion
2. **EthereumAPI.mo** - Production Ethereum integration using official EVM RPC canister
3. **ChainKeyTokenAPI.mo** - Production ckBTC/ckETH/ckUSDC integration using official IC canisters
4. **Production Canister Integration** - Uses real mainnet IC infrastructure

### Production Canister IDs (Mainnet)

```
EVM RPC Canister:     7hfb6-caaaa-aaaar-qadga-cai
ckBTC Ledger:         mxzaz-hqaaa-aaaar-qaada-cai
ckBTC Minter:         mqygn-kiaaa-aaaar-qaadq-cai
ckBTC Index:          n5wcd-faaaa-aaaar-qaaea-cai
ckETH Ledger:         ss2fx-dyaaa-aaaar-qacoq-cai
ckETH Minter:         sv3dd-oaaaa-aaaar-qacoa-cai
ckETH Index:          s3zol-vqaaa-aaaar-qacpa-cai
```

## User Flow (Production)

1. **User Registration**: User calls `createUserProfile()` which automatically generates:
   - Bitcoin address using production ckBTC minter
   - Ethereum address using threshold ECDSA (secp256k1)

2. **Bitcoin Deposit**: User sends BTC to their generated Bitcoin address
   - Bitcoin automatically converts to ckBTC via official ckBTC minter
   - ckBTC appears in user's IC account

3. **Loan Creation**: User calls `createCrossChainLoan()`:
   - System validates collateral ratio (150% minimum)
   - Creates loan record with automatic Ethereum address
   - Prepares for ckUSDC to USDC conversion

4. **Chain Fusion Execution**: System automatically:
   - Converts ckUSDC to native USDC on Ethereum
   - Transfers USDC to user's Ethereum address
   - User can now use USDC on Ethereum while BTC remains as collateral

5. **Wallet Signing**: Canister can sign transactions on behalf of user:
   - Uses threshold ECDSA for Ethereum transactions
   - Enables automated DeFi interactions

## Key Features

### Production-Ready Security
- **Threshold ECDSA**: Uses IC's production threshold ECDSA for secure key management
- **Official Canisters**: Integrates with production IC infrastructure
- **Collateral Management**: Real-time liquidation monitoring with 120% threshold
- **Price Oracle Integration**: Supports external price feeds for BTC/USD

### Cross-Chain Functionality
- **Bitcoin Integration**: Direct integration with ckBTC minter for address generation
- **Ethereum Integration**: Native USDC transfers via Chain Fusion
- **EVM RPC**: Uses official EVM RPC canister for Ethereum interactions
- **Multi-Chain Support**: Ready for Arbitrum, Base, Optimism, Polygon

### Risk Management
- **Minimum Collateral Ratio**: 150% to prevent liquidations
- **Liquidation Threshold**: 120% for risk management
- **Loan Limits**: 100 USDC minimum, 1M USDC maximum
- **Interest Rates**: 5% APR with 0.5% origination fee

## Deployment Instructions

### Prerequisites

1. **DFX Installation**: Install latest dfx version
2. **Mainnet Access**: Ensure dfx is configured for mainnet deployment
3. **Cycles**: Have sufficient cycles for mainnet deployment (minimum 10T cycles)
4. **Identity**: Set up your dfx identity for mainnet

### Step 1: Environment Setup

```bash
# Set dfx to mainnet
dfx start --clean
dfx identity use default

# Check cycle balance
dfx wallet balance --network ic
```

### Step 2: Deploy to Mainnet

```bash
# Deploy the production canister
dfx deploy BitPesaChainFusionProduction --network ic --with-cycles 5000000000000

# Verify deployment
dfx canister status BitPesaChainFusionProduction --network ic
```

### Step 3: Initialize System

```bash
# Get your canister ID
export CANISTER_ID=$(dfx canister id BitPesaChainFusionProduction --network ic)

# Test basic functionality
dfx canister call BitPesaChainFusionProduction healthCheck --network ic
```

### Step 4: Production Configuration

```bash
# Update BTC price (replace with oracle integration)
dfx canister call BitPesaChainFusionProduction updateBtcPrice "(50000000000, principal \"$(dfx identity get-principal)\")" --network ic

# Check system stats
dfx canister call BitPesaChainFusionProduction getSystemStats --network ic
```

## API Reference

### Core Functions

#### User Management
```motoko
// Create user profile with generated addresses
createUserProfile(userPrincipal : Principal) : async SystemResult<UserProfile>

// Get user profile information
getUserProfile(userPrincipal : Principal) : async SystemResult<UserProfile>

// Generate Bitcoin deposit address
generateUserBitcoinAddress(userPrincipal : Principal) : async SystemResult<Text>

// Generate Ethereum address for USDC
generateUserEthereumAddress(userPrincipal : Principal) : async SystemResult<Text>
```

#### Loan Management
```motoko
// Create cross-chain loan with auto Ethereum address
createCrossChainLoan(
    borrower : Principal,
    collateralAmount : TokenAmount,
    loanAmount : TokenAmount,
    ethereumAddress : ?Text
) : async SystemResult<LoanRecord>

// Get loan information
getLoan(loanId : LoanId) : async SystemResult<LoanRecord>

// Get all user loans
getUserLoans(userPrincipal : Principal) : async SystemResult<[LoanRecord]>
```

#### Collateral Management
```motoko
// Check user's ckBTC balance
getUserCollateralBalance(userPrincipal : Principal) : async SystemResult<TokenAmount>

// Calculate maximum loan amount
calculateMaxLoanAmount(collateralAmount : TokenAmount) : SystemResult<TokenAmount>
```

#### System Monitoring
```motoko
// Get system statistics
getSystemStats() : async {
    totalCollateral : TokenAmount;
    totalDebt : TokenAmount;
    totalLoans : Nat;
    activeLoans : Nat;
    btcPrice : Nat;
    lastPriceUpdate : Timestamp;
}

// Health check for monitoring
healthCheck() : async {
    status : Text;
    timestamp : Timestamp;
    canisterBalance : Text;
    systemHealth : Text;
}
```

## Testing on Mainnet

### Step 1: Create User Profile

```bash
# Create user profile (generates Bitcoin and Ethereum addresses)
dfx canister call BitPesaChainFusionProduction createUserProfile "(principal \"$(dfx identity get-principal)\")" --network ic
```

### Step 2: Check Generated Addresses

```bash
# Get user profile with addresses
dfx canister call BitPesaChainFusionProduction getUserProfile "(principal \"$(dfx identity get-principal)\")" --network ic
```

### Step 3: Fund with ckBTC

Send real BTC to the generated Bitcoin address or transfer ckBTC to your account:

```bash
# Check ckBTC balance
dfx canister call BitPesaChainFusionProduction getUserCollateralBalance "(principal \"$(dfx identity get-principal)\")" --network ic
```

### Step 4: Create Loan

```bash
# Create a loan (amounts in e8s for ckBTC, e6s for USDC)
dfx canister call BitPesaChainFusionProduction createCrossChainLoan "(
    principal \"$(dfx identity get-principal)\",
    100000000,  // 1 ckBTC collateral (1e8)
    30000000000, // 30,000 USDC loan (30000 * 1e6)
    null
)" --network ic
```

## Production Monitoring

### Key Metrics to Monitor

1. **System Health**: Call `healthCheck()` regularly
2. **Collateral Ratios**: Monitor via `getSystemStats()`
3. **Price Staleness**: Check `lastPriceUpdate` timestamps
4. **Liquidation Risk**: Monitor loans approaching 120% threshold

### Alerting Setup

```bash
# Example monitoring script
#!/bin/bash
HEALTH=$(dfx canister call BitPesaChainFusionProduction healthCheck --network ic)
if [[ $HEALTH == *"warning"* ]]; then
    echo "Alert: System health warning detected"
    # Send alert to monitoring system
fi
```

## Security Considerations

### Production Security Features

1. **Threshold ECDSA**: Uses IC's production mainnet key_1
2. **Official Canisters**: All integrations use verified IC canisters
3. **Collateral Safety**: 150% minimum collateral ratio
4. **Liquidation Protection**: Automatic liquidation at 120%
5. **Amount Limits**: Prevents excessive exposure

### Risk Management

1. **Price Oracle**: Implement robust price feed integration
2. **Admin Controls**: Implement proper admin authorization
3. **Circuit Breakers**: Emergency pause functionality
4. **Upgrade Safety**: Stable storage for state persistence

## Chain Fusion Integration

### Supported Networks

- **Ethereum Mainnet**: Native USDC transfers
- **Arbitrum One**: Layer 2 scaling
- **Base**: Coinbase L2
- **Optimism**: Optimistic rollup
- **Polygon**: Side chain

### EVM RPC Integration

The system uses the official EVM RPC canister (7hfb6-caaaa-aaaar-qadga-cai) for:

- Balance checking on Ethereum
- Transaction submission
- Transaction status monitoring
- Gas estimation

## Troubleshooting

### Common Issues

1. **Address Generation Fails**: Check threshold ECDSA availability
2. **ckBTC Balance Zero**: Verify Bitcoin deposits and minter processing
3. **Loan Creation Fails**: Check collateral ratio and amounts
4. **Price Stale**: Update price oracle integration

### Debug Commands

```bash
# Check canister status
dfx canister status BitPesaChainFusionProduction --network ic

# Check system health
dfx canister call BitPesaChainFusionProduction healthCheck --network ic

# Check current BTC price
dfx canister call BitPesaChainFusionProduction getBtcPrice --network ic
```

## Future Enhancements

1. **Price Oracle Integration**: Connect to Chainlink or other oracle providers
2. **Automated Liquidations**: Implement keeper network
3. **Additional Collateral**: Support ckETH and other assets
4. **Advanced DeFi**: Yield farming on deposited assets
5. **Mobile SDK**: Native mobile app integration

## Support

For production deployment support:
1. Check IC documentation: https://internetcomputer.org/docs
2. Review dfx commands: https://internetcomputer.org/docs/current/references/cli-reference/dfx-parent
3. Monitor system health regularly
4. Implement proper monitoring and alerting
