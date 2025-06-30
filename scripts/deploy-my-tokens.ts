// Simple script to deploy tokens and log results
import { ethers } from "hardhat";

async function main() {
  console.log("======================================================");
  console.log("STARTING TOKEN DEPLOYMENT");
  console.log("======================================================");
  
  try {
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying tokens with the account: ${deployer.address}`);
    
    // Deploy MockWBTC
    console.log("Deploying MockWBTC...");
    const MockWBTC = await ethers.getContractFactory("MockWBTC");
    const wbtc = await MockWBTC.deploy();
    await wbtc.waitForDeployment();
    const wbtcAddress = await wbtc.getAddress();
    console.log(`MockWBTC deployed to: ${wbtcAddress}`);
    console.log(`21,000,000 WBTC minted to: ${deployer.address}`);
    
    // Deploy MockUSDC
    console.log("Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log(`MockUSDC deployed to: ${usdcAddress}`);
    console.log(`1,000,000 USDC minted to: ${deployer.address}`);
    
    // Log token addresses for reference
    console.log("\nTOKEN DEPLOYMENT SUMMARY:");
    console.log(`WBTC Address: ${wbtcAddress}`);
    console.log(`USDC Address: ${usdcAddress}`);
    console.log(`Owner Address: ${deployer.address}`);
    console.log("\nAdd these to your .env file:");
    console.log(`WBTC_ADDRESS=${wbtcAddress}`);
    console.log(`USDC_ADDRESS=${usdcAddress}`);
    
    console.log("======================================================");
    console.log("TOKEN DEPLOYMENT COMPLETED SUCCESSFULLY");
    console.log("======================================================");
    
    return {
      wbtcAddress,
      usdcAddress,
      ownerAddress: deployer.address
    };
  } catch (error) {
    console.error("ERROR DURING TOKEN DEPLOYMENT:");
    console.error(error);
    process.exit(1);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
