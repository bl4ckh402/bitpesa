# Token Deployment and Platform Setup Guide

This guide will help you deploy your own WBTC and USDC tokens and set up the BitPesa platform using these tokens.

## Prerequisites

1. Make sure your `.env` file is properly set up with your private key and RPC URL.
   - You can copy `.env.example` to `.env` and fill in your details.

```
PRIVATE_KEY=your_private_key_here
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
SNOWTRACE_API_KEY=your_snowtrace_api_key_here (optional for verification)
```

## Step 1: Deploy Your Own WBTC and USDC Tokens

Run the following command to deploy your custom WBTC and USDC tokens:

```bash
npm run deploy:tokens
```

This will:
- Deploy a MockWBTC token with 100 WBTC minted to your address
- Deploy a MockUSDC token with 1,000,000 USDC minted to your address
- Print out the addresses of the deployed tokens

Take note of these addresses and add them to your `.env` file:

```
WBTC_ADDRESS=your_deployed_wbtc_address
USDC_ADDRESS=your_deployed_usdc_address
```

## Step 2: Verify Your Token Contracts (Optional)

If you want to verify your token contracts on Snowtrace (Avalanche's block explorer), run:

```bash
npm run verify:tokens
```

This requires that you have set the `SNOWTRACE_API_KEY` in your `.env` file and that you've added the token addresses from Step 1.

## Step 3: Deploy the BitPesa Platform Using Your Tokens

Now that you have your own tokens deployed, you can deploy the BitPesa platform using them:

```bash
npm run deploy:fuji:with-tokens
```

This will:
- Use your deployed WBTC and USDC addresses from the `.env` file
- Deploy the BitPesaPriceConsumer, BitPesaLending, and BitPesaTokenBridge contracts
- Configure the token bridge with supported chains
- Add initial liquidity to the lending platform
- Print out all contract addresses for reference

## Step 4: Verify the BitPesa Contracts (Optional)

To verify all the deployed BitPesa contracts:

```bash
npm run verify:all
```

## Usage Notes

- Your account now has 100 WBTC and 1,000,000 USDC that you can use for testing the platform.
- The contracts are configured to work with the Avalanche Fuji testnet.
- The BitPesa platform uses Chainlink services for price feeds and cross-chain interoperability.
