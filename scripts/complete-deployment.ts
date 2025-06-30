// End-to-end deployment script for BitPesa platform
import { ethers } from "hardhat";
import "dotenv/config";
import contractAddresses, { AVALANCHE_FUJI_CHAIN_ID } from "../fe/lib/config";
import { BitPesaPriceConsumer, BitPesaLending, BitPesaTokenBridge } from "../typechain-types";
import { IERC20 } from "../typechain-types/@openzeppelin/contracts/token/ERC20";


async function deployPlatform() {
  console.log("======================================================");
  console.log("DEPLOYING BITPESA PLATFORM WITH EXISTING TOKENS");
  console.log("======================================================");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying BitPesa with the account: ${deployer.address}`);
  
  // Get token addresses from environment variables
  const wbtcAddress = process.env.WBTC_ADDRESS_SUPPORTED || "";
  const usdcAddress = process.env.USDC_ADDRESS || "";
  const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS || "";
  
  // Addresses for Chainlink on Avalanche Fuji Testnet
  const AVALANCHE_FUJI_BTC_USD_PRICE_FEED = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a"; // Chainlink BTC/USD on Fuji
  const AVALANCHE_FUJI_CCIP_ROUTER = "0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8"; // Chainlink CCIP Router on Fuji
  
  // Validate that we have all required addresses
  if (!wbtcAddress || !usdcAddress || !linkTokenAddress) {
    throw new Error("Missing required token addresses in environment variables. Please set WBTC_ADDRESS_SUPPORTED, USDC_ADDRESS, and LINK_TOKEN_ADDRESS");
  }
  
  console.log("Using token addresses:");
  console.log(`WBTC: ${wbtcAddress}`);
  console.log(`USDC: ${usdcAddress}`);
  console.log(`LINK: ${linkTokenAddress}`);
  
  // Get contract factories
  const BitPesaLending = await ethers.getContractFactory("BitPesaLending");
  const BitPesaTokenBridge = await ethers.getContractFactory("BitPesaTokenBridge");
  
  // Use existing price consumer address
  const priceConsumerAddress = contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaPriceConsumer;
  console.log(`Using existing BitPesaPriceConsumer at: ${priceConsumerAddress}`);
  
  console.log("Deploying BitPesaLending...");
  const lendingPlatform = await BitPesaLending.deploy(
    wbtcAddress,
    usdcAddress,
    AVALANCHE_FUJI_BTC_USD_PRICE_FEED
  );
  await lendingPlatform.waitForDeployment();
  const lendingPlatformAddress = await lendingPlatform.getAddress();
  console.log(`BitPesaLending deployed to: ${lendingPlatformAddress}`);
  
  console.log("Deploying BitPesaTokenBridge...");
  const tokenBridge = await BitPesaTokenBridge.deploy(
    AVALANCHE_FUJI_CCIP_ROUTER,
    linkTokenAddress // Using LINK token address for the bridge
  );
  await tokenBridge.waitForDeployment();
  const tokenBridgeAddress = await tokenBridge.getAddress();
  console.log(`BitPesaTokenBridge deployed to: ${tokenBridgeAddress}`);
  
  return { priceConsumerAddress, lendingPlatformAddress, tokenBridgeAddress };
}

async function setupPlatform(
  tokenBridgeAddress: string, 
  lendingPlatformAddress: string
) {
  console.log("======================================================");
  console.log("SETTING UP BITPESA PLATFORM");
  console.log("======================================================");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  
  // Get USDC address from environment variables
  const usdcAddress = process.env.USDC_ADDRESS || "";
  if (!usdcAddress) {
    throw new Error("Missing USDC_ADDRESS in environment variables");
  }
  
  // Get contract factories
  const BitPesaTokenBridge = await ethers.getContractFactory("BitPesaTokenBridge");
  const BitPesaLending = await ethers.getContractFactory("BitPesaLending");
  const ERC20 = await ethers.getContractFactory("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20");
    // Connect to deployed contracts
  const tokenBridge = BitPesaTokenBridge.attach(tokenBridgeAddress);
  const usdcToken = ERC20.attach(usdcAddress);
  const lendingPlatform = BitPesaLending.attach(lendingPlatformAddress);
  
  // Set up supported chains for the token bridge
  console.log("Setting up supported chains for token bridge...");
  
  // Chain selectors for CCIP
  const ETH_SEPOLIA_SELECTOR = "16015286601757825753";
  const BASE_SEPOLIA_SELECTOR = "10344971235874465080";
  
  console.log("Adding Ethereum Sepolia as supported chain...");
  let tx = await tokenBridge.addSupportedChain(ETH_SEPOLIA_SELECTOR);
  await tx.wait();

  await tx.wait();
  console.log("Adding Base Sepolia as supported chain...");
  tx = await tokenBridge.addSupportedChain(BASE_SEPOLIA_SELECTOR);
  await tx.wait();
  
  // Add initial liquidity to the lending platform
  console.log("Adding initial USDC liquidity to the lending platform...");
  
  // Check USDC decimals first
  const usdcDecimals = await usdcToken.decimals();
  console.log(`USDC token has ${usdcDecimals} decimals`);
  
  // Approve USDC for the lending platform
  console.log("Approving USDC transfer...");
  const usdcAmount = ethers.parseUnits("0.01", usdcDecimals);
  tx = await usdcToken.approve(lendingPlatformAddress, usdcAmount);
  await tx.wait();
  
  // Add liquidity
  console.log("Adding liquidity to lending platform...");
  tx = await lendingPlatform.addLiquidity(usdcAmount);
  await tx.wait();
  console.log(`Added 10,000 USDC as initial liquidity`);
  
  return { success: true };
}

async function main() {
  try {
    console.log("======================================================");
    console.log("STARTING BITPESA DEPLOYMENT WITH EXISTING TOKENS");
    console.log("======================================================");
    
    // Get token addresses from environment variables
    const wbtcAddress = process.env.WBTC_ADDRESS_SUPPORTED || "";
    const usdcAddress = process.env.USDC_ADDRESS || "";
    
    if (!wbtcAddress || !usdcAddress) {
      throw new Error("Missing token addresses in environment variables. Please set WBTC_ADDRESS_SUPPORTED and USDC_ADDRESS");
    }
    
    // Step 1: Deploy platform with existing tokens
    const { priceConsumerAddress, lendingPlatformAddress, tokenBridgeAddress } = 
      await deployPlatform();
    
    // Step 2: Set up platform
    await setupPlatform(tokenBridgeAddress, lendingPlatformAddress);
    
    // Final summary
    console.log("\n======================================================");
    console.log("DEPLOYMENT SUMMARY");
    console.log("======================================================");
    console.log("Token Contracts (From Environment):");
    console.log(`- WBTC Address: ${wbtcAddress}`);
    console.log(`- USDC Address: ${usdcAddress}`);
    console.log(`- LINK Address: ${process.env.LINK_TOKEN_ADDRESS}`);
    console.log("\nPlatform Contracts:");
    console.log(`- BitPesaPriceConsumer: ${priceConsumerAddress}`);
    console.log(`- BitPesaLending: ${lendingPlatformAddress}`);
    console.log(`- BitPesaTokenBridge: ${tokenBridgeAddress}`);
    console.log("\nAdd these to your .env and frontend .env.local files:");
    console.log(`TOKEN_BRIDGE_ADDRESS=${tokenBridgeAddress}`);
    console.log(`NEXT_PUBLIC_TOKEN_BRIDGE_ADDRESS=${tokenBridgeAddress}`);
    console.log("======================================================");
    console.log("DEPLOYMENT COMPLETED SUCCESSFULLY");
    console.log("======================================================");
    
    return {
      wbtcAddress,
      usdcAddress,
      priceConsumerAddress,
      lendingPlatformAddress,
      tokenBridgeAddress
    };
  } catch (error) {
    console.error("ERROR DURING DEPLOYMENT:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
