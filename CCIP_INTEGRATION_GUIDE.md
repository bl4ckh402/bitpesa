# Chainlink CCIP Integration Guide for BitPesa

This guide provides information about the integration of Chainlink Cross-Chain Interoperability Protocol (CCIP) into the BitPesa platform.

## Overview

BitPesa integrates Chainlink CCIP to enable cross-chain token transfers, allowing users to transfer WBTC between different blockchain networks seamlessly. This functionality is implemented in the `BitPesaTokenBridge` contract.

## Supported Networks

The BitPesa platform supports the following networks for cross-chain transfers:

### Testnets
- Ethereum Sepolia (Chain Selector: 16015286601757825753)
- Avalanche Fuji (Chain Selector: 14767482510784806043)
- Polygon Mumbai (Chain Selector: 12532609583862916517)

### Mainnets (Coming Soon)
- Ethereum Mainnet
- Avalanche
- Polygon
- Arbitrum
- Optimism
- Base

## Contract Architecture

The CCIP integration is built around the following components:

1. **BitPesaTokenBridge**: The main contract that handles cross-chain token transfers
2. **IRouterClient**: Interface for interacting with the Chainlink CCIP Router
3. **Client Library**: Contains structures and helper functions for CCIP messages

## Key Features

### Cross-Chain Token Transfer

Users can transfer WBTC tokens from one blockchain to another using:

1. **Native Token for Fees**: `transferTokensPayNative` function where gas fees are paid in the native blockchain token (ETH, AVAX, etc.)
2. **LINK Token for Fees**: `transferTokensPayLink` function where gas fees are paid in LINK tokens

### Security Features

- Non-reentrant functions to prevent reentrancy attacks
- Chain allowlisting to ensure tokens can only be sent to supported chains
- Ownership controls for critical functions

## Fee Structure

Fees for cross-chain transfers are determined by the Chainlink CCIP network and vary based on:

1. The source and destination chains
2. The amount of data being transferred
3. The token transfer amount
4. Network congestion

Users can choose to pay fees in either the native blockchain token or LINK tokens.

## Transaction Flow

The following diagram illustrates the flow of a cross-chain token transfer:

```
User -> BitPesaTokenBridge (Source Chain) -> CCIP Router -> 
  -> Lane Contract -> 
    -> Destination Chain Router -> BitPesaTokenBridge (Destination Chain) -> Receiver
```

## Deployment Process

To deploy the BitPesaTokenBridge contract:

1. Run the deployment script: `npx hardhat run scripts/deploy-ccip-token-bridge.ts --network <NETWORK_NAME>`
2. The script will:
   - Deploy the contract with the correct router and token addresses for the specified network
   - Configure supported destination chains
   - Optionally fund the contract with ETH for CCIP fees

## Testing Cross-Chain Transfers

To test a cross-chain token transfer:

1. Set the environment variables:
   ```bash
   export TOKEN_BRIDGE_ADDRESS=<DEPLOYED_BRIDGE_ADDRESS>
   export WBTC_ADDRESS=<DEPLOYED_WBTC_ADDRESS>
   ```

2. Run the test script:
   ```bash
   npx hardhat run scripts/test-ccip-token-transfer.ts --network <SOURCE_NETWORK>
   ```

3. Monitor the transaction on the CCIP Explorer: [https://ccip.chain.link](https://ccip.chain.link)

## Monitoring and Troubleshooting

### CCIP Explorer

You can track the status of cross-chain transactions using the CCIP Explorer:
- Testnet: [https://ccip.chain.link](https://ccip.chain.link)

### Common Issues and Solutions

1. **Transaction Pending for a Long Time**
   - Check if you provided enough gas for the transaction
   - Verify that CCIP services are operational

2. **Destination Chain Not Supported Error**
   - Ensure the destination chain is added to the supported chains list

3. **Insufficient Fee Error**
   - Ensure the contract has enough native tokens or LINK tokens to cover fees

## Maintenance and Upgrades

The BitPesaTokenBridge contract is designed to be maintained by the contract owner who can:

1. Add or remove supported chains
2. Withdraw excess ETH or tokens from the contract
3. Handle future CCIP protocol upgrades

## Resources

- [Chainlink CCIP Documentation](https://docs.chain.link/ccip)
- [CCIP API Reference](https://docs.chain.link/ccip/api-reference)
- [CCIP Supported Networks](https://docs.chain.link/ccip/supported-networks)
