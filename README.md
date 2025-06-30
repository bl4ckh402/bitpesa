# BitPesa: Bitcoin-Backed Lending for the Real World

## Vision & Mission

BitPesa is on a mission to unlock the value of Bitcoin for everyone, everywhere. Our dream is to enable anyone to use their BTC as collateral to access instant loans in their local currency—directly to their bank account or mobile money wallet. We believe in a world where your digital assets can power your real-world needs, bridging the gap between decentralized finance and everyday life.

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

## Smart Contract Addresses (Avalanche Fuji Testnet)

- BitPesaLending: [TBD]
- BitPesaPriceConsumer: [TBD]  
- BitPesaTokenBridge: [TBD]

## License

This project is licensed under the ISC License.
