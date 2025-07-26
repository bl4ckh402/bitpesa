# BitPesa Cross-Chain Lending with Chain Fusion

This repository contains the implementation of BitPesa's cross-chain lending platform, which allows users to deposit BTC on the Internet Computer as collateral and receive USDC loans on Ethereum, leveraging Chain Fusion technology.

## Architecture Overview

The platform uses several key technologies:

1. **Bitcoin Integration**: Direct Bitcoin integration with ICP's Chain Key technology for secure Bitcoin deposits
2. **Chain Key Tokens**: Using ckUSDC as the intermediary token for loans
3. **Chain Fusion**: Converting ckUSDC to native USDC on Ethereum using Chain Fusion
4. **EVM RPC Canister**: Communication with Ethereum network via ICP's EVM RPC canister

## Key Components

- `EthereumAPI.mo`: Provides integration with Ethereum and EVM-compatible chains
- `BitPesaChainFusion.mo`: Main canister for cross-chain lending functionality
- `EvmRpcInterface.mo`: Low-level interface for the EVM RPC canister
- `ChainKeyTokenAPI.mo`: Operations for Chain Key tokens like ckUSDC

## Flow Description

1. User deposits Bitcoin to a specified address controlled by the BitPesa canister
2. The system verifies the Bitcoin deposit using ICP's native Bitcoin integration
3. Once confirmed, the system converts ckUSDC to native USDC on Ethereum
4. The converted USDC is sent to the user's Ethereum address
5. The Bitcoin collateral is held until the loan is repaid

## Setup & Deployment

To deploy this project, you need to have the DFINITY SDK installed.

```bash
# Install the DFINITY SDK
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Clone the repository
git clone <repo-url>
cd bitpesa

# Deploy locally
dfx start --background --clean
dfx deploy
```

## Usage Examples

See `ethereum-integration-examples.mo` for example code showing how to use the cross-chain lending functionality.

## Configuration

The project requires the following canister IDs to be properly configured:

- EVM RPC Canister: `7hfb6-caaaa-aaaar-qadga-cai` (Production)
- ckUSDC Canister: `mxzaz-hqaaa-aaaar-qaada-cai` (Production)

## Security Considerations

The platform implements several security measures:

1. Multiple confirmations for Bitcoin deposits
2. Threshold ECDSA signing for secure key management
3. Proper collateralization ratios to prevent undercollateralized loans
4. Secure HTTP outcalls with proper response validation

## License

MIT License
