# BitPesa: Bitcoin-Backed Lending for the Real World

## Vision & Mission

BitPesa is on a mission to unlock the value of Bitcoin/AVAX for everyone, everywhere. Our dream is to enable anyone to use their BTC as collateral to access instant loans in their local currency—directly to their bank account or mobile money wallet. We believe in a world where your digital assets can power your real-world needs, bridging the gap between decentralized finance and everyday life.

- **Lend out fiat, collateralized with BTC**: Secure a loan in your local currency by locking up your Bitcoin as collateral.
- **Receive funds in your bank or mobile money**: No stablecoin knowledge required—just real cash, delivered where you need it.
- **Global access, local impact**: Designed for emerging markets and anyone underserved by traditional finance.

## Our Plan & Roadmap

1. **Hackathon MVP (Current Phase)**
   - Launch a working prototype using USDC as the loan currency, with WBTC as collateral, on Avalanche Fuji Testnet.
   - Integrate Chainlink oracles for secure BTC/USD pricing and automated liquidations.
   - Build a user-friendly web interface for deposits, withdrawals, and loan management.

2. **Post-Hackathon: Real-World Fiat Integration**
   - Expand to support direct fiat payouts to bank accounts and mobile money (e.g., M-Pesa, Airtel Money, etc.).
   - Partner with payment processors and local financial institutions for seamless off-ramps.
   - Add support for more blockchains and collateral types.

3. **Long-Term Vision**
   - Become the go-to platform for unlocking liquidity from Bitcoin, serving users globally with instant, borderless, and accessible lending.
   - Enable new financial products (e.g., savings, remittances, microloans) powered by crypto collateral.

## Why BitPesa?

- **Unlock your BTC**: Don’t sell your Bitcoin—use it to access cash when you need it.
- **No credit checks**: Your crypto is your credit. Instant approval, no paperwork.
- **Local currency, global reach**: Get paid in the currency you use every day, wherever you are.
- **Secure & Transparent**: Powered by smart contracts, Chainlink oracles, and non-custodial design.

---

# BitPesa: WBTC-Based DeFi Platform

BitPesa is a decentralized finance platform built for the Chromion Chainlink Hackathon. It enables users to utilize WBTC as collateral for stablecoin loans with real-time price feeds from Chainlink, automated liquidations, and cross-chain capabilities.

## Chainlink Hackathon Submission

This project uses multiple Chainlink services to create an innovative DeFi platform:

1. **Chainlink Price Feeds** for real-time BTC/USD price data, ensuring accurate collateral valuation
2. **Chainlink Automation** for automatic health checks and liquidation of undercollateralized loans
3. **Chainlink CCIP** (Cross-Chain Interoperability Protocol) for seamless transfer of WBTC between blockchains

## Features

- **WBTC Collateralized Loans**: Use Wrapped Bitcoin (WBTC) as collateral to borrow stablecoins
- **Advanced Risk Management**: Automated health checks and configurable collateral ratios
- **Cross-Chain Capabilities**: Bridge WBTC across Avalanche, Ethereum, Polygon, and other chains
- **Non-Custodial Design**: Users maintain control of their assets at all times
- **Avalanche Integration**: Deployed on Avalanche Fuji Testnet for fast, low-cost transactions

## Architecture

The platform consists of three main smart contracts:

1. **BitPesaLending**: Core lending platform for WBTC collateralized loans
2. **BitPesaPriceConsumer**: Price feed consumer for BTC/USD data
3. **BitPesaTokenBridge**: Cross-chain bridge for WBTC transfers using CCIP

## Chainlink Integration

BitPesa leverages multiple Chainlink services:

- **Price Feeds**: For accurate BTC/USD prices
- **Automation**: For automated loan health monitoring and liquidations
- **Cross-Chain Interoperability Protocol (CCIP)**: For secure cross-chain WBTC transfers

## Getting Started

### Prerequisites

- Node.js v16+
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bl4ckh402/bitpesa.git
cd bitpesa
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Fill in your environment variables:
```
PRIVATE_KEY=your_wallet_private_key
SNOWTRACE_API_KEY=your_snowtrace_api_key
```

### Deployment

Deploy to Avalanche Fuji Testnet:
```bash
npx hardhat deploy --network avalancheFuji
```

### Testing

Run tests with:
```bash
npx hardhat test
```

# BitPesa Crypto Will Service

This document provides information about the BitPesa Crypto Will service, which allows users to create digital wills for their crypto assets, ensuring they are transferred to designated beneficiaries upon specific conditions.

## Overview

BitPesa Crypto Will is a decentralized service that enables users to create digital wills for their WBTC assets, with plans to expand to other assets in the future. The service combines blockchain technology with traditional legal frameworks to provide secure and reliable asset transfer upon death, incapacitation, or other specified conditions.

## Key Features

- **KYC Verification**: User identity verification for compliance with regulations
- **Multiple Release Conditions**:
  - Inactivity period detection ("dead man's switch")
  - Death certificate validation
  - Scheduled release
  - Manual executor approval
- **Multi-Beneficiary Support**: Designate multiple beneficiaries with custom percentage allocations
- **Chainlink Automation**: Automatic checking of inactivity periods
- **Activity Registration**: Register activity to reset inactivity timer
- **Executor Authority**: Optional trusted third-party approval for will execution
- **Metadata Storage**: Off-chain storage of additional will details via IPFS
- **Beneficiary Verification**: Optional KYC verification for beneficiaries

## Creating a Will

To create a crypto will using BitPesa:

1. Complete KYC verification to ensure legal compliance
2. Connect your wallet containing WBTC assets
3. Designate beneficiaries and their respective shares
4. Choose your preferred release condition:
   - Inactivity period (e.g., no activity for 12 months)
   - Death certificate validation
   - Scheduled release at a specific future date
   - Manual execution by a trusted executor
5. Set additional parameters like inactivity period length
6. Provide off-chain metadata for additional legal documentation
7. Approve and sign the transaction

## Security Measures

- **Smart Contract Security**: Audited and secure smart contracts
- **Multi-signature Options**: Requirement for multiple approvals for critical actions
- **KYC Verification**: Identity verification for both will creators and beneficiaries
- **Activity Monitoring**: Regular prompts for activity registration
- **Executor Authority**: Optional trusted third-party verification
- **Death Certificate Validation**: Verification by designated authorities

## Technical Details

The BitPesa Crypto Will service is built on the following technologies:

- **Smart Contracts**: Ethereum-compatible solidity smart contracts
- **Chainlink Automation**: For automated checking of inactivity periods
- **IPFS**: For storing off-chain will metadata and documents
- **Supabase Database**: For tracking will creation and execution events
- **Web3 Integration**: For wallet connections and transaction signing

## Legal Considerations

While BitPesa Crypto Will provides a technical solution for digital asset inheritance, users are advised to also:

- Consult with legal professionals in their jurisdiction
- Create traditional legal wills that reference their BitPesa Crypto Will
- Keep beneficiaries informed about the existence and details of the will
- Regularly review and update their will as needed

## Future Developments

- Support for additional crypto assets beyond WBTC
- Integration with traditional estate planning services
- Enhanced privacy features
- Multi-chain support
