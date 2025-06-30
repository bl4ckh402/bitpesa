# BitPesa Deployment Guide

This guide will walk you through deploying your custom WBTC and USDC tokens and setting up the BitPesa platform.

## Prerequisites

1. Ensure you have set up your `.env` file with these variables:
   ```
   PRIVATE_KEY=your_private_key_here
   AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
   SNOWTRACE_API_KEY=your_snowtrace_api_key_here (optional, for verification)
   ```

2. Compile your contracts before deployment:
   ```
   npm run compile
   ```

## Step 1: Deploy Your Custom Tokens

To deploy your custom WBTC and USDC tokens to the Avalanche Fuji testnet:

```
npm run deploy:my-tokens
```

If you see no output, you can also try running it directly with npx:

```
npx hardhat run scripts/deploy-my-tokens.ts --network avalancheFuji
```

After successful deployment, you should see output containing your WBTC and USDC addresses. Save these addresses and add them to your `.env` file:

```
WBTC_ADDRESS=your_deployed_wbtc_address
USDC_ADDRESS=your_deployed_usdc_address
```

The tokens have been configured to mint:
- 21,000,000 WBTC to your deployer address
- 1,000,000 USDC to your deployer address

## Step 2: Deploy the BitPesa Platform with Your Tokens

Now that you have your token addresses, you can deploy the BitPesa platform:

```
npm run deploy:complete
```

Or use npx directly:

```
npx hardhat run scripts/complete-deployment.ts --network avalancheFuji
```

This script will:
1. Use your deployed token addresses from .env
2. Deploy the BitPesaPriceConsumer, BitPesaLending, and BitPesaTokenBridge contracts
3. Configure the token bridge to support Ethereum Sepolia and Polygon Mumbai
4. Add 10,000 USDC initial liquidity to the lending platform

## Troubleshooting

If you encounter issues with script execution, you can manually execute each step one by one:

### 1. Deploy Tokens
```javascript
// In a hardhat console (npx hardhat console --network avalancheFuji)
const MockWBTC = await ethers.getContractFactory("MockWBTC");
const wbtc = await MockWBTC.deploy();
await wbtc.waitForDeployment();
const wbtcAddress = await wbtc.getAddress();
console.log(`WBTC: ${wbtcAddress}`);

const MockUSDC = await ethers.getContractFactory("MockUSDC");
const usdc = await MockUSDC.deploy();
await usdc.waitForDeployment();
const usdcAddress = await usdc.getAddress();
console.log(`USDC: ${usdcAddress}`);
```

### 2. Deploy Platform
```javascript
// After setting WBTC_ADDRESS and USDC_ADDRESS in .env
const wbtcAddress = process.env.WBTC_ADDRESS;
const usdcAddress = process.env.USDC_ADDRESS;
const priceFeed = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a";
const ccipRouter = "0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8";

const BitPesaPriceConsumer = await ethers.getContractFactory("BitPesaPriceConsumer");
const priceConsumer = await BitPesaPriceConsumer.deploy(priceFeed);
await priceConsumer.waitForDeployment();
const priceConsumerAddress = await priceConsumer.getAddress();

const BitPesaLending = await ethers.getContractFactory("BitPesaLending");
const lending = await BitPesaLending.deploy(wbtcAddress, usdcAddress, priceFeed);
await lending.waitForDeployment();
const lendingAddress = await lending.getAddress();

const BitPesaTokenBridge = await ethers.getContractFactory("BitPesaTokenBridge");
const bridge = await BitPesaTokenBridge.deploy(ccipRouter, wbtcAddress);
await bridge.waitForDeployment();
const bridgeAddress = await bridge.getAddress();
```

## Interacting with Your Contracts

Once deployed, you can interact with your contracts using the Hardhat console or a dApp frontend.

### Example: Check Your WBTC Balance
```javascript
const MockWBTC = await ethers.getContractFactory("MockWBTC");
const wbtc = await MockWBTC.attach("YOUR_WBTC_ADDRESS");
const [deployer] = await ethers.getSigners();
const balance = await wbtc.balanceOf(deployer.address);
console.log(`WBTC Balance: ${ethers.formatUnits(balance, 8)}`);
```

### Example: Check Your USDC Balance
```javascript
const MockUSDC = await ethers.getContractFactory("MockUSDC");
const usdc = await MockUSDC.attach("YOUR_USDC_ADDRESS");
const [deployer] = await ethers.getSigners();
const balance = await usdc.balanceOf(deployer.address);
console.log(`USDC Balance: ${ethers.formatUnits(balance, 6)}`);
```

## Contract Verification

To verify your contracts on Snowtrace:

```
npm run verify:tokens
```

For platform contracts:
```
npm run verify:all
```

Remember to update the verification scripts with your contract addresses.
