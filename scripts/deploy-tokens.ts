import { ethers } from "hardhat";

async function main() {
  // Added more logging to troubleshoot
  console.log("====== SCRIPT STARTED ======");
  console.log("Starting deployment of tokens to Avalanche Fuji Testnet...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying tokens with the account: ${deployer.address}`);
  const deployerAddress = deployer.address;
  
  // Deploy MockWBTC
  console.log("Deploying MockWBTC...");
  const MockWBTC = await ethers.getContractFactory("MockWBTC");
  const wbtc = await MockWBTC.deploy();
  await wbtc.waitForDeployment();
  const wbtcAddress = await wbtc.getAddress();
  console.log(`MockWBTC deployed to: ${wbtcAddress}`);
  console.log(`100 WBTC minted to: ${deployerAddress}`);
  
  // Deploy MockUSDC
  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`MockUSDC deployed to: ${usdcAddress}`);
  console.log(`1,000,000 USDC minted to: ${deployerAddress}`);
  
  // Log token addresses for reference
  console.log("\nToken Deployment Summary:");
  console.log(`WBTC Address: ${wbtcAddress}`);
  console.log(`USDC Address: ${usdcAddress}`);
  console.log(`Owner Address: ${deployerAddress}`);
  
  // Return addresses for use in other scripts
  return {
    wbtcAddress,
    usdcAddress,
    deployerAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
