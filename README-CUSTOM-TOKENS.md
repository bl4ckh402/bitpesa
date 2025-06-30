# BitPesa Custom Token Deployment & Integration Guide

This guide provides instructions for deploying your own WBTC and USDC tokens and integrating them with the BitPesa platform.

## Overview

You'll be deploying:
1. Custom WBTC token (21,000,000 tokens minted to your address)
2. Custom USDC token (1,000,000 tokens minted to your address)
3. BitPesa platform using these tokens

## Prerequisites

1. Make sure your environment is set up correctly:
   - Node.js and npm installed
   - Project dependencies installed (`npm install`)
   - `.env` file with your private key:
     ```
     PRIVATE_KEY=your_private_key_here
     AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
     ```

## Option 1: Automated Deployment (Recommended)

### Step 1: Deploy everything in one command

This deploys all tokens and contracts in a single command:

```bash
npx hardhat deploy --network avalancheFuji
```

After deployment, copy the token addresses from the console output and add them to your `.env` file:

```
WBTC_ADDRESS=your_deployed_wbtc_address
USDC_ADDRESS=your_deployed_usdc_address
```

## Option 2: Step-by-Step Deployment

### Step 1: Deploy only the custom tokens

```bash
npx hardhat deploy --tags Tokens --network avalancheFuji
```

### Step 2: Record the token addresses

Add the output addresses to your `.env` file:

```
WBTC_ADDRESS=your_deployed_wbtc_address
USDC_ADDRESS=your_deployed_usdc_address
```

### Step 3: Deploy the platform contracts

```bash
npx hardhat deploy --tags Platform --network avalancheFuji
```

## Option 3: Manual Deployment via Hardhat Console

If you prefer more control, you can manually deploy through the Hardhat console:

```bash
npx hardhat console --network avalancheFuji
```

### Deploy WBTC
```javascript
const MockWBTC = await ethers.getContractFactory("MockWBTC")
const wbtc = await MockWBTC.deploy()
await wbtc.waitForDeployment()
const wbtcAddress = await wbtc.getAddress()
console.log(`WBTC deployed at: ${wbtcAddress}`)
```

### Deploy USDC
```javascript
const MockUSDC = await ethers.getContractFactory("MockUSDC")
const usdc = await MockUSDC.deploy()
await usdc.waitForDeployment()
const usdcAddress = await usdc.getAddress()
console.log(`USDC deployed at: ${usdcAddress}`)
```

### Verify your token balances
```javascript
const [deployer] = await ethers.getSigners()
const wbtcBalance = await wbtc.balanceOf(deployer.address)
console.log(`WBTC Balance: ${ethers.formatUnits(wbtcBalance, 8)}`)
const usdcBalance = await usdc.balanceOf(deployer.address)
console.log(`USDC Balance: ${ethers.formatUnits(usdcBalance, 6)}`)
```

## Contract Verification

After deploying your tokens, you can verify them on Snowscan:

### Option 1: Verify using hardhat verify
```bash
npx hardhat verify --network avalancheFuji WBTC_ADDRESS
npx hardhat verify --network avalancheFuji USDC_ADDRESS
```

### Option 2: Run the verification script
```bash
npx hardhat run scripts/verify-tokens.ts --network avalancheFuji
```

## Integrating with BitPesa Platform

Once your tokens are deployed and verified, you can integrate them with the BitPesa platform:

1. Create loans using your WBTC as collateral
2. Receive USDC as the loan amount
3. Bridge tokens across chains using the BitPesaTokenBridge

## Working with Your Tokens

### Minting Additional Tokens

If you need to mint more tokens, you can use the mint function:

```javascript
// In hardhat console
const wbtc = await ethers.getContractAt("MockWBTC", "YOUR_WBTC_ADDRESS")
const [deployer] = await ethers.getSigners()
await wbtc.mint(deployer.address, ethers.parseUnits("100", 8)) // Mint 100 more WBTC
```

### Transferring Tokens

To transfer tokens to another address:

```javascript
const recipient = "RECIPIENT_ADDRESS"
const amount = ethers.parseUnits("10", 8) // 10 WBTC
await wbtc.transfer(recipient, amount)
```

## Troubleshooting

- **Missing token addresses**: If your .env file doesn't have the token addresses, the scripts will deploy new tokens.
- **Verification errors**: Make sure your SNOWTRACE_API_KEY is correctly set in your .env file.
- **Transaction failures**: Check that you have sufficient AVAX in your account for gas fees.

## Custom Token Details

- **MockWBTC**:
  - Symbol: WBTC
  - Decimals: 8
  - Initial Supply: 21,000,000 WBTC (to your address)

- **MockUSDC**:
  - Symbol: USDC
  - Decimals: 6
  - Initial Supply: 1,000,000 USDC (to your address)

Both tokens implement standard ERC20 functionality plus mint and burn capabilities.

## Next Steps

After successful deployment:
1. Start testing the BitPesa platform with your tokens
2. Integrate with your frontend applications
3. Use the tokens in your DeFi lending and borrowing workflows
