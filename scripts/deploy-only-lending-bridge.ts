// Script to deploy only the lending platform and token bridge with existing tokens
import { ethers } from "hardhat";
import "dotenv/config";
import { BitPesaLending, BitPesaTokenBridge } from "../typechain-types";
import { IERC20 } from "../typechain-types/@openzeppelin/contracts/token/ERC20";

// Chain selectors for CCIP
const CHAIN_SELECTORS = {
  ETHEREUM_SEPOLIA: "16015286601757825753",
  AVALANCHE_FUJI: "14767482510784806043",
  POLYGON_MUMBAI: "12532609583862916517",
  BASE_SEPOLIA: "10344971235874465080"
};

async function main() {
  try {
    console.log("======================================================");
    console.log("DEPLOYING BITPESA LENDING AND TOKEN BRIDGE");
    console.log("======================================================");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with the account: ${deployer.address}`);
    
    // Get addresses from environment variables
    const wbtcAddress = process.env.WBTC_ADDRESS_SUPPORTED;
    const usdcAddress = process.env.USDC_ADDRESS;
    const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS;
    
    // Check if required addresses are present
    if (!wbtcAddress || !usdcAddress || !linkTokenAddress) {
      throw new Error("Missing required environment variables: WBTC_ADDRESS_SUPPORTED, USDC_ADDRESS, or LINK_TOKEN_ADDRESS");
    }
    
    console.log(`Using token addresses:`);
    console.log(`WBTC: ${wbtcAddress}`);
    console.log(`USDC: ${usdcAddress}`);
    console.log(`LINK: ${linkTokenAddress}`);
    
    // Addresses for Chainlink on Avalanche Fuji Testnet
    const AVALANCHE_FUJI_BTC_USD_PRICE_FEED = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a";
    const AVALANCHE_FUJI_CCIP_ROUTER = "0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8";
    
    // Deploy BitPesaLending
    console.log("\nDeploying BitPesaLending...");
    const BitPesaLending = await ethers.getContractFactory("BitPesaLending");
    const lendingPlatform = await BitPesaLending.deploy(
      wbtcAddress,
      usdcAddress,
      AVALANCHE_FUJI_BTC_USD_PRICE_FEED
    );
    await lendingPlatform.waitForDeployment();
    const lendingPlatformAddress = await lendingPlatform.getAddress();
    console.log(`BitPesaLending deployed to: ${lendingPlatformAddress}`);
    
    // Deploy BitPesaTokenBridge
    console.log("\nDeploying BitPesaTokenBridge...");
    const BitPesaTokenBridge = await ethers.getContractFactory("BitPesaTokenBridge");
    const tokenBridge = await BitPesaTokenBridge.deploy(
      AVALANCHE_FUJI_CCIP_ROUTER,
      linkTokenAddress
    );
    await tokenBridge.waitForDeployment();
    const tokenBridgeAddress = await tokenBridge.getAddress();
    console.log(`BitPesaTokenBridge deployed to: ${tokenBridgeAddress}`);
    
    // Set up the token bridge
    console.log("\nSetting up supported chains for token bridge...");
    
    console.log("Adding Ethereum Sepolia as supported chain...");
    let tx = await tokenBridge.addSupportedChain(CHAIN_SELECTORS.ETHEREUM_SEPOLIA);
    await tx.wait();
    console.log("Added Ethereum Sepolia as supported chain");
    
    console.log("Adding Base Sepolia as supported chain...");
    tx = await tokenBridge.addSupportedChain(CHAIN_SELECTORS.BASE_SEPOLIA);
    await tx.wait();
    console.log("Added Base Sepolia as supported chain");
    
    // Add initial liquidity to the lending platform
    console.log("\nAdding initial liquidity to lending platform...");
      // For ERC20 interactions, use a more basic interface that doesn't require decimals
    const usdcContract = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      usdcAddress
    );
    
    // Assume 6 decimals for USDC (standard)
    const usdcDecimals = usdcContract.decimals ? await usdcContract.decimals() : 6;
    console.log(`Using USDC with ${usdcDecimals} decimals`);
    
    // Approve and add liquidity
    const usdcAmount = ethers.parseUnits("0.01", usdcDecimals);
    const balance = await usdcContract.balanceOf(deployer.address);
    console.log(`Deployer USDC balance: ${ethers.formatUnits(balance, usdcDecimals)}`);
    console.log("Approving USDC transfer...");
    console.log(deployer.address, lendingPlatformAddress, usdcAmount);
    tx = await usdcContract.approve(lendingPlatformAddress, usdcAmount);
    await tx.wait();
    console.log("USDC approved for lending platform");
    
    console.log("Adding liquidity to lending platform...");
    tx = await lendingPlatform.addLiquidity(usdcAmount);
    await tx.wait();
    console.log(`Added ${usdcAmount} USDC as initial liquidity`);

    // Final summary
    console.log("\n======================================================");
    console.log("DEPLOYMENT SUMMARY");
    console.log("======================================================");
    console.log("Token Contracts (From Environment):");
    console.log(`- WBTC Address: ${wbtcAddress}`);
    console.log(`- USDC Address: ${usdcAddress}`);
    console.log(`- LINK Address: ${linkTokenAddress}`);
    console.log("\nDeployed Platform Contracts:");
    console.log(`- BitPesaLending: ${lendingPlatformAddress}`);
    console.log(`- BitPesaTokenBridge: ${tokenBridgeAddress}`);
    console.log("\nAdd these to your .env and frontend .env.local files:");
    console.log(`TOKEN_BRIDGE_ADDRESS=${tokenBridgeAddress}`);
    console.log(`NEXT_PUBLIC_TOKEN_BRIDGE_ADDRESS=${tokenBridgeAddress}`);
    console.log("======================================================");
    console.log("DEPLOYMENT COMPLETED SUCCESSFULLY");
    console.log("======================================================");
    
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
