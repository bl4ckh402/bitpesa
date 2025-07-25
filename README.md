# BitPesa - Cross-Chain Bitcoin Lending Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![ICP Integration](https://img.shields.io/badge/ICP-Integration-29ABE2?style=for-the-badge&logo=internet-computer)](https://internetcomputer.org)
[![Chainlink](https://img.shields.io/badge/Chainlink-Oracle-375BD2?style=for-the-badge&logo=chainlink)](https://chain.link)

## 🚀 Overview

BitPesa is a revolutionary cross-chain DeFi lending platform that bridges traditional financial services with decentralized finance. Built on the Internet Computer Protocol (ICP) and integrated with multiple blockchain networks, BitPesa enables users to:

- **Deposit Bitcoin** as collateral
- **Borrow Local Currency** (KES/USD) against Bitcoin collateral
- **Integrate with M-Pesa** for seamless African market access
- **Cross-chain operations** across Avalanche, Ethereum, and other networks
- **Automated liquidation** protection with real-time price oracles

## 🏗️ Architecture

BitPesa employs a multi-layered architecture combining:

### Backend Infrastructure
- **Internet Computer Protocol (ICP)**: Core lending logic and canister-based architecture
- **HTTPS Outcalls**: Real-time Bitcoin price feeds
- **Canister Timers**: Automated liquidation monitoring

### Frontend Application
- **Next.js 14**: Modern React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **GSAP**: Advanced animations and interactions
- **Radix UI**: Accessible component library

### Blockchain Integration
- **Avalanche Fuji**: Smart contract deployment and testing
- **Chainlink Price Feeds**: Real-time BTC/USD price data
- **WalletConnect**: Multi-wallet support
- **ICRC-1 Tokens**: ckBTC and stablecoin standards

## 🛠️ Technology Stack

### Smart Contracts & Backend
- **Motoko** - ICP native language for canister development
- **ICRC-1** - Token standards for ckBTC and stablecoins


### Frontend & UI
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **GSAP** - Professional-grade animations
- **Framer Motion** - React animation library
- **React Hook Form** - Form state management
- **Zod** - TypeScript-first schema validation

### Authentication & Identity
- **Internet Identity** - ICP's decentralized identity system
- **WalletConnect** - Multi-wallet connection protocol
- **Wagmi** - React hooks for Ethereum interactions

### Database & Storage
- **Supabase** - PostgreSQL database and real-time features
- **Local Storage** - Client-side state persistence

### Development & Deployment
- **Vercel** - Frontend deployment and hosting
- **dfx** - DFINITY Canister SDK
- **Git** - Version control
- **ESLint & Prettier** - Code formatting and linting

## 📁 Project Structure

```
bitpesa/
├── fe/                          # Frontend Next.js application
│   ├── app/                     # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # User dashboard
│   │   ├── earn/               # Yield farming section
│   │   └── settings/           # User settings
│   ├── components/             # React components
│   │   ├── forms/              # Form components
│   │   ├── icp/                # ICP-specific components
│   │   ├── layout/             # Layout components
│   │   ├── mpesa/              # M-Pesa integration components
│   │   ├── sections/           # Landing page sections
│   │   └── ui/                 # Reusable UI components
│   ├── lib/                    # Utility libraries
│   │   ├── constants/          # App constants
│   │   ├── contracts/          # Smart contract ABIs
│   │   ├── declarations/       # ICP canister declarations
│   │   ├── hooks/              # Custom React hooks
│   │   ├── providers/          # Context providers
│   │   ├── services/           # External services
│   │   ├── supabase/           # Database client
│   │   ├── types/              # TypeScript definitions
│   │   └── utils/              # Utility functions
│   └── public/                 # Static assets
├── motoko/                     # ICP Motoko smart contracts
│   ├── BitPesaLending.mo       # Main lending canister
│   ├── CoinbaseParser.mo       # Price oracle parser
│   ├── ICRC1.mo               # Token standard implementation
│   └── PriceParser.mo         # Price data utilities
├── package.json               # Root package configuration
└── tsconfig.json             # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **dfx** (DFINITY Canister SDK) - for ICP development
- **Hardhat** - for EVM smart contract development

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bl4ckh402/bitpesa.git
   cd bitpesa
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd fe
   npm install
   ```

4. **Environment Setup**
   
   Create environment files for different configurations:
   
   ```bash
   # In the fe/ directory
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   # ICP Canister IDs
   NEXT_PUBLIC_BITPESA_BACKEND_CANISTER_ID=your_backend_canister_id
   NEXT_PUBLIC_BITPESA_ENHANCED_CANISTER_ID=your_enhanced_canister_id
   NEXT_PUBLIC_INTERNET_IDENTITY_CANISTER_ID=rdmx6-jaaaa-aaaaa-aaadq-cai
   
   # WalletConnect Project ID
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Development

#### Running the Frontend

1. **Start the development server**
   ```bash
   cd fe
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

2. **Using the VS Code task**
   
   Alternatively, you can use the predefined VS Code task:
   - Open the project in VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Tasks: Run Task"
   - Select "Start BitPesa Frontend"

#### ICP Canister Development

1. **Start the local ICP replica**
   ```bash
   dfx start --background
   ```

2. **Deploy canisters locally**
   ```bash
   dfx deploy
   ```

3. **Auto-generate environment variables**
   ```bash
   cd fe
   npm run setup-icp
   ```

#### Smart Contract Development (EVM)

1. **Compile contracts**
   ```bash
   npm run compile
   ```

2. **Deploy to Avalanche Fuji testnet**
   ```bash
   npm run deploy:fuji
   ```

3. **Deploy tokens locally**
   ```bash
   npm run deploy:tokens:local
   ```

## 🔧 Available Scripts

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run setup-icp    # Generate ICP environment variables
```

### Root Scripts
```bash
npm run test                 # Run Hardhat tests
npm run compile             # Compile smart contracts
npm run deploy:fuji         # Deploy to Avalanche Fuji
npm run deploy:local        # Deploy to local network
npm run deploy:tokens       # Deploy token contracts
npm run verify:contract     # Verify deployed contracts
```

## 🌐 Deployment

### Frontend Deployment (Vercel)

The frontend is automatically deployed to Vercel on every push to the main branch.

1. **Manual deployment**
   ```bash
   cd fe
   npm run build
   vercel --prod
   ```

### ICP Canister Deployment

1. **Deploy to IC mainnet**
   ```bash
   dfx deploy --network ic
   ```

2. **Deploy to local network**
   ```bash
   dfx deploy --network local
   ```

## 🔗 Core Features

### 1. Bitcoin Collateralized Lending
- Deposit BTC as collateral
- Borrow KES/USD against Bitcoin holdings
- Automated liquidation protection
- Real-time collateral ratio monitoring

### 2. Cross-Chain Integration
- Avalanche network support
- Ethereum compatibility
- Multi-wallet connection
- Seamless asset bridging

### 3. M-Pesa Integration
- Direct disbursements to M-Pesa accounts
- Transaction history tracking
- KES currency support
- Mobile-first user experience

### 4. Advanced UI/UX
- Responsive design across all devices
- Dark/light theme support
- Smooth GSAP animations
- Accessible component design
- Real-time data updates

### 5. DeFi Yield Opportunities
- Yield farming pools
- Liquidity provision rewards
- Cross-chain yield strategies
- Risk assessment tools

## 🔐 Security Features

- **Multi-signature wallets** for enhanced security
- **Time-locked contracts** for upgrade governance
- **Automated liquidation** to protect lenders
- **Oracle price validation** with multiple data sources
- **Rate limiting** on sensitive operations

## 🧪 Testing

### Frontend Testing
```bash
cd fe
npm run test
```

### Smart Contract Testing
```bash
npm run test
```

### Integration Testing
```bash
# Test ICP integration
cd fe
npm run test:icp

# Test cross-chain functionality
npm run test:cross-chain
```

## 📊 API Documentation

### ICP Canister Methods

#### Lending Operations
- `depositCollateral(amount: Nat)` - Deposit ckBTC collateral
- `createLoan(amount: Nat, duration: Nat)` - Create a new loan
- `repayLoan(loanId: LoanId, amount: Nat)` - Repay loan
- `withdrawCollateral(amount: Nat)` - Withdraw excess collateral

#### Query Methods
- `getUserLoans(user: Principal)` - Get user's active loans
- `getLoanDetails(loanId: LoanId)` - Get specific loan information
- `getCollateralRatio(user: Principal)` - Get user's collateral ratio
- `getBtcPrice()` - Get current BTC/USD price

### REST API Endpoints

```
GET  /api/loans              # Get all loans
POST /api/loans              # Create new loan
GET  /api/loans/:id          # Get specific loan
PUT  /api/loans/:id          # Update loan
GET  /api/users/:id/profile  # Get user profile
POST /api/mpesa/disburse     # Initiate M-Pesa disbursement
GET  /api/mpesa/status/:id   # Check transaction status
```

## 🤝 Contributing

We welcome contributions to BitPesa! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript strict mode
- Use conventional commit messages
- Ensure all tests pass
- Update documentation for new features
- Follow the existing code style

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [https://bitpesa.xyz](https://bitpesa.xyz)
- **Documentation**: [https://docs.bitpesa.app](https://docs.bitpesa.app)
- **ICP Integration Guide**: [fe/docs/ICP_INTEGRATION.md](fe/docs/ICP_INTEGRATION.md)
- **GitHub**: [https://github.com/bl4ckh401/bitpesa](https://github.com/bl4ckh401/bitpesa)

## 📞 Support

For support and questions:

- **GitHub Issues**: [Report bugs or request features](https://github.com/bl4ckh401/bitpesa/issues)

- **Email**: pavkiptoo@gmail.com

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic lending functionality
- ✅ ICP integration
- ✅ M-Pesa integration
- ✅ Frontend UI/UX

### Phase 2 (Q2 2025)
- 🔄 Multi-collateral support
- 🔄 Advanced liquidation mechanisms
- 🔄 Governance token launch
- 🔄 Mobile app development

### Phase 3 (Q3 2025)
- 📋 Additional blockchain integrations
- 📋 Institutional lending features
- 📋 Advanced DeFi strategies
- 📋 Global expansion

---

**Built with ❤️ by the BitPesa Team**

*Empowering financial inclusion through decentralized Bitcoin lending.*
