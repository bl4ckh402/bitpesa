# BitPesa Custom Token Deployment Guide

## Automated Deployment (Option 1)

### Deploy everything in one command

This will deploy your custom tokens and the BitPesa platform in one command:

```bash
npx hardhat deploy --network avalancheFuji
```

### Verify the contracts (optional)

```bash
npx hardhat verify --network avalancheFuji [CONTRACT_ADDRESS] [CONSTRUCTOR_ARGS]
```

## Step-by-Step Deployment (Option 2)

### 1. Deploy your custom tokens

```bash
npx hardhat deploy --tags Tokens --network avalancheFuji
```

The tokens will be deployed and the addresses will be shown in the console output.

### 2. Add the token addresses to your .env file

```
WBTC_ADDRESS=your_deployed_wbtc_address
USDC_ADDRESS=your_deployed_usdc_address
```

## Using Hardhat Console for Manual Deployment

If you need more control over the deployment process, you can use the Hardhat console:

### 1. Start the Hardhat console

```bash
npx hardhat console --network avalancheFuji
```

### 2. Deploy your WBTC token

```javascript
const MockWBTC = await ethers.getContractFactory("MockWBTC")
const wbtc = await MockWBTC.deploy()
await wbtc.waitForDeployment()
const wbtcAddress = await wbtc.getAddress()
console.log(`WBTC deployed at: ${wbtcAddress}`)
```

### 3. Deploy your USDC token

```javascript
const MockUSDC = await ethers.getContractFactory("MockUSDC")
const usdc = await MockUSDC.deploy()
await usdc.waitForDeployment()
const usdcAddress = await usdc.getAddress()
console.log(`USDC deployed at: ${usdcAddress}`)
```

### 4. Check your token balances

```javascript
const [deployer] = await ethers.getSigners()
const wbtcBalance = await wbtc.balanceOf(deployer.address)
console.log(`WBTC Balance: ${ethers.formatUnits(wbtcBalance, 8)}`)
const usdcBalance = await usdc.balanceOf(deployer.address)
console.log(`USDC Balance: ${ethers.formatUnits(usdcBalance, 6)}`)
```

## Token Configurations

- **MockWBTC**:
  - Symbol: WBTC
  - Decimals: 8
  - Initial supply: 21,000,000 WBTC (minted to deployer)

- **MockUSDC**:
  - Symbol: USDC
  - Decimals: 6
  - Initial supply: 1,000,000 USDC (minted to deployer)

Both tokens include mint and burn functions for your convenience.

## After Deployment

After successful deployment, you can use these tokens with the BitPesa platform for:
- Lending against your WBTC as collateral
- Receiving USDC loans
- Cross-chain transfers using the token bridge
