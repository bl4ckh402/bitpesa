# BitPesa Chain Fusion Lending System

## Overview

BitPesa's Chain Fusion lending system enables users to:
1. **Deposit Bitcoin** as collateral on the Internet Computer
2. **Borrow USDC** that gets automatically sent to their Ethereum address
3. **Manage their Ethereum wallet** through the canister's threshold ECDSA signing

This creates a seamless cross-chain lending experience using ICP's Chain Fusion capabilities.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Bitcoin       │    │   ICP Canister   │    │   Ethereum      │
│   Network       │    │   (BitPesa)      │    │   Network       │
│                 │    │                  │    │                 │
│  User deposits  │───▶│  • ckBTC as      │───▶│  USDC sent to   │
│  BTC to         │    │    collateral    │    │  user's ETH     │
│  generated      │    │  • Threshold     │    │  address        │
│  address        │    │    ECDSA keys    │    │                 │
│                 │    │  • Loan mgmt     │    │  Canister can   │
│                 │    │                  │    │  sign txs       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Key Features

### 🔑 **Automatic Address Generation**
- Bitcoin addresses generated using threshold ECDSA
- Ethereum addresses generated using the same key derivation
- Users get deterministic, unique addresses for each chain

### 💰 **Cross-Chain Lending**
- Deposit BTC → Receive USDC on Ethereum
- Overcollateralized loans (150% collateral ratio)
- Automatic liquidation protection

### 📝 **Transaction Signing**
- Canister can sign Ethereum transactions on user's behalf
- Enables automated loan management
- Secure threshold ECDSA signatures

### ⚡ **Chain Fusion Integration**
- Seamless ckUSDC → USDC conversion
- Real-time price oracles
- Cross-chain state management

## Usage Flow

### 1. **User Onboarding**

```motoko
// Generate Bitcoin address for deposits
let btcAddress = await bitpesa.generateOrGetBitcoinAddress();

// Generate Ethereum address for USDC
let ethAddress = await bitpesa.generateUserEthereumAddress();
```

### 2. **Bitcoin Deposit**

```bash
# User sends BTC to their generated address
bitcoin-cli sendtoaddress <btc_address> 0.01

# Canister detects deposit and updates collateral
let collateral = await bitpesa.depositBitcoinCollateral();
```

### 3. **Create Cross-Chain Loan**

```motoko
// Borrow 1000 USDC for 30 days using BTC collateral
let loanId = await bitpesa.createCrossChainLoan(
    1000_000_000, // 1000 USDC (6 decimals)
    30,           // 30 days
    null          // Auto-generate ETH address
);
```

### 4. **Manage Ethereum Wallet**

```motoko
// Check USDC balance on Ethereum
let balance = await bitpesa.getErc20BalanceForUser(user, usdcAddress);

// Transfer USDC on behalf of user
let txHash = await bitpesa.transferErc20OnBehalfOf(
    user,
    toAddress,
    amount
);
```

### 5. **Loan Repayment**

```motoko
// Repay loan and unlock BTC collateral
await bitpesa.repayLoan(loanId);
```

## Technical Implementation

### Threshold ECDSA Integration

The system uses ICP's threshold ECDSA to:
- Generate deterministic addresses for users
- Sign Bitcoin transactions
- Sign Ethereum transactions
- Manage cross-chain assets

```motoko
// Get user's Ethereum address
public func getUserEthereumAddress(userPrincipal : Principal) : async EvmResult<EvmAddress> {
    let userBytes = Blob.toArray(Principal.toBlob(userPrincipal));
    let derivationPath = [Blob.fromArray(userBytes)];
    await getEthereumAddress(derivationPath);
};

// Sign Ethereum transaction
public func signEthereumTransaction(
    transactionHash : [Nat8],
    derivationPath : [Blob]
) : async EvmResult<[Nat8]> {
    let signResult = await IC.sign_with_ecdsa({
        message_hash = Blob.fromArray(transactionHash);
        derivation_path = derivationPath;
        key_id = #MainNet;
    });
    #ok(Blob.toArray(signResult.signature));
};
```

### Chain Fusion Flow

```motoko
// Convert ckUSDC to USDC on Ethereum
public func sendUsdcToEthereum(
    amount : Nat,
    ethereumAddress : EthereumAPI.EvmAddress
) : async Result.Result<Text, AppError> {
    let conversion = await ChainKeyTokenAPI.convertCkUsdcToEthereumUsdc(
        ckusdcCanister,
        amount,
        ethereumAddress,
        ?{owner = ownPrincipal; subaccount = null}
    );
    // Handle conversion result...
};
```

## Security Features

### 🔒 **Collateral Management**
- 150% overcollateralization requirement
- Real-time price monitoring
- Automatic liquidation at 125% ratio

### 🛡️ **Access Control**
- Only loan holders can have transactions signed
- Secure derivation paths per user
- Principal-based authentication

### ⚖️ **Risk Management**
- Maximum loan duration limits
- Minimum deposit thresholds
- Protocol fee collection

## API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `generateOrGetBitcoinAddress()` | Generate user's Bitcoin deposit address |
| `generateUserEthereumAddress()` | Generate user's Ethereum address |
| `depositBitcoinCollateral()` | Process Bitcoin collateral deposit |
| `createCrossChainLoan()` | Create loan and send USDC to Ethereum |
| `repayLoan()` | Repay loan and release collateral |

### Ethereum Management

| Function | Description |
|----------|-------------|
| `signEthereumTransactionForUser()` | Sign ETH tx on user's behalf |
| `transferErc20OnBehalfOf()` | Transfer ERC-20 tokens for user |
| `getErc20BalanceForUser()` | Check user's token balance |

### Query Functions

| Function | Description |
|----------|-------------|
| `getUserLoans()` | Get user's loan history |
| `getPlatformStats()` | Get platform statistics |
| `getUserBitcoinAddress()` | Get user's Bitcoin address |
| `getUserEthereumAddress()` | Get user's Ethereum address |

## Deployment

### Prerequisites

```bash
# Install dfx
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Start local Bitcoin regtest
./deploy.sh
```

### Configuration

```motoko
let bitpesaConfig : Types.ChainFusionConfig = {
    own_principal = Principal.fromActor(MyCanister);
    owner = Principal.fromText("your-owner-principal");
    ckbtc_canister = Principal.fromText("mxzaz-hqaaa-aaaar-qaada-cai");
    stablecoin_canister = Principal.fromText("xkbqi-2qaaa-aaaal-qb55a-cai");
    ckusdc_canister = Principal.fromText("xjngq-yaaaa-aaaal-qb56q-cai");
    evm_rpc_canister = ?Principal.fromText("7hfb6-caaaa-aaaar-qadga-cai");
};
```

### Deploy

```bash
dfx deploy --network local
dfx deploy --network ic  # For mainnet
```

## Example Usage

See `chain-fusion-lending-example.mo` for a complete implementation example.

## Security Considerations

1. **Private Key Management**: Uses ICP's secure threshold ECDSA
2. **Collateral Monitoring**: Real-time price feeds and liquidation
3. **Access Control**: Principal-based user authentication
4. **Transaction Validation**: All cross-chain operations are verified

## Support

For questions or issues:
- GitHub Issues: [BitPesa Repository]
- Documentation: [Chain Fusion Docs]
- Community: [ICP Developer Forum]

---

**⚠️ Disclaimer**: This is a demonstration system. Use appropriate security audits and testing before production deployment.
