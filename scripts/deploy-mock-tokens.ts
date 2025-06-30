import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment of mock tokens...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying tokens with the account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} AVAX`);
  
  // Deploy MockWBTC
  console.log("Deploying MockWBTC...");
  const MockWBTC = await ethers.getContractFactory("MockWBTC");
  const wbtc = await MockWBTC.deploy();
  await wbtc.waitForDeployment();
  const wbtcAddress = await wbtc.getAddress();
  console.log(`MockWBTC deployed to: ${wbtcAddress}`);
  
  // Deploy MockUSDC
  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`MockUSDC deployed to: ${usdcAddress}`);
  
  console.log("Mock token deployment complete!");
  console.log("----------------------------------");
  console.log("Mock WBTC address:", wbtcAddress);
  console.log("Mock USDC address:", usdcAddress);
  console.log("----------------------------------");
  
  // Get and display token information
  const wbtcDecimals = await wbtc.decimals();
  const wbtcSymbol = await wbtc.symbol();
  const wbtcBalance = await wbtc.balanceOf(deployer.address);
  console.log(`${wbtcSymbol} balance: ${ethers.formatUnits(wbtcBalance, wbtcDecimals)} ${wbtcSymbol}`);
  
  const usdcDecimals = await usdc.decimals();
  const usdcSymbol = await usdc.symbol();
  const usdcBalance = await usdc.balanceOf(deployer.address);
  console.log(`${usdcSymbol} balance: ${ethers.formatUnits(usdcBalance, usdcDecimals)} ${usdcSymbol}`);
  
  return {
    wbtcAddress,
    usdcAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
