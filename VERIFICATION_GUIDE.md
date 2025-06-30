# Token Verification Guide

## Verifying Your Deployed Tokens

After deploying your custom WBTC and USDC tokens, you'll need to verify them on Snowscan (Avalanche Explorer) so that users can interact with them through the block explorer.

### Method 1: Using the Verification Script

The simplest way to verify both tokens is using the `verify:tokens` script:

```bash
# First, make sure your token addresses are in your .env file
# WBTC_ADDRESS=0x1E3857fd780FD7ab35Ce19e37D6789bB5d45Ebd8
# USDC_ADDRESS=0xa4Ec7d8543490C093928B5d5645340a403c3a337

# Then run the verification script
npm run verify:tokens
```

This script will automatically specify the correct contract path for each token.

### Method 2: Manual Verification of Individual Contracts

You can also use the `verify:contract` script to verify any contract with its specific path:

```bash
# For WBTC
npm run verify:contract -- 0x1E3857fd780FD7ab35Ce19e37D6789bB5d45Ebd8 "contracts/tokens/MockWBTC.sol:MockWBTC"

# For USDC
npm run verify:contract -- 0xa4Ec7d8543490C093928B5d5645340a403c3a337 "contracts/tokens/MockUSDC.sol:MockUSDC"
```

### Method 3: Using Hardhat Verify Command Directly

You can also use the Hardhat verify command directly:

```bash
npx hardhat verify --network avalancheFuji --contract "contracts/tokens/MockWBTC.sol:MockWBTC" 0x1E3857fd780FD7ab35Ce19e37D6789bB5d45Ebd8

npx hardhat verify --network avalancheFuji --contract "contracts/tokens/MockUSDC.sol:MockUSDC" 0xa4Ec7d8543490C093928B5d5645340a403c3a337
```

## Troubleshooting

### "Multiple Contracts Match" Error

If you see an error like this:
```
Error verifying: DeployedBytecodeMultipleMatchesError: More than one contract was found to match the deployed bytecode.
```

This means Hardhat couldn't determine which contract to verify because multiple contracts have similar bytecode. The solution is to explicitly specify the contract path using the `--contract` parameter as shown above.

### "Already Verified" Error

If you see an error mentioning the contract is already verified, this is actually good news! It means your contract is already verified on the blockchain explorer.

### API Key Error

If you see an error related to the API key, make sure your `SNOWTRACE_API_KEY` is properly set in your `.env` file.

## After Verification

Once verified, you can visit your contracts on the Avalanche Fuji Testnet Explorer (Snowscan):

- WBTC: https://testnet.snowscan.xyz/address/0x1E3857fd780FD7ab35Ce19e37D6789bB5d45Ebd8
- USDC: https://testnet.snowscan.xyz/address/0xa4Ec7d8543490C093928B5d5645340a403c3a337

On these pages, you can:
- View the contract source code
- Interact with your token functions through the "Write Contract" and "Read Contract" tabs
- View token transfers, holders, and other information
