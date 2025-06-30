import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment to Avalanche Fuji Testnet...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} AVAX`);
  
  // First, deploy our mock tokens
  console.log("\n--- Deploying mock tokens ---");
  
  // Deploy MockWBTC
  console.log("\nDeploying MockWBTC...");
  const MockWBTC = await ethers.getContractFactory("MockWBTC");
  const mockWBTC = await MockWBTC.deploy();
  await mockWBTC.waitForDeployment();
  const wbtcAddress = await mockWBTC.getAddress();
  console.log(`MockWBTC deployed to: ${wbtcAddress}`);
  
  // Deploy MockUSDC
  console.log("\nDeploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log(`MockUSDC deployed to: ${usdcAddress}`);
  
  // Get token information
  const wbtcDecimals = await mockWBTC.decimals();
  const wbtcBalance = await mockWBTC.balanceOf(deployer.address);
  console.log(`WBTC balance: ${ethers.formatUnits(wbtcBalance, wbtcDecimals)} WBTC`);
  
  const usdcDecimals = await mockUSDC.decimals();
  const usdcBalance = await mockUSDC.balanceOf(deployer.address);
  console.log(`USDC balance: ${ethers.formatUnits(usdcBalance, usdcDecimals)} USDC`);
  
  // Addresses for Chainlink services on Avalanche Fuji
  const BTC_USD_PRICE_FEED = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a"; // Chainlink BTC/USD on Fuji
  const CCIP_ROUTER = "0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8"; // Chainlink CCIP Router on Fuji
  
  console.log("\n--- Deploying BitPesa contracts ---");
  
  // Deploy BitPesaPriceConsumer
  console.log("\nDeploying BitPesaPriceConsumer...");
  const BitPesaPriceConsumer = await ethers.getContractFactory("BitPesaPriceConsumer");
  const priceConsumer = await BitPesaPriceConsumer.deploy(BTC_USD_PRICE_FEED);
  await priceConsumer.waitForDeployment();
  const priceConsumerAddress = await priceConsumer.getAddress();
  console.log(`BitPesaPriceConsumer deployed to: ${priceConsumerAddress}`);
  
  // Deploy BitPesaLending
  console.log("\nDeploying BitPesaLending...");
  const BitPesaLending = await ethers.getContractFactory("BitPesaLending");
  const lendingPlatform = await BitPesaLending.deploy(
    wbtcAddress,
    usdcAddress,
    BTC_USD_PRICE_FEED
  );
  await lendingPlatform.waitForDeployment();
  const lendingPlatformAddress = await lendingPlatform.getAddress();
  console.log(`BitPesaLending deployed to: ${lendingPlatformAddress}`);
  
  // Deploy BitPesaTokenBridge
  console.log("\nDeploying BitPesaTokenBridge...");
  const BitPesaTokenBridge = await ethers.getContractFactory("BitPesaTokenBridge");
  const tokenBridge = await BitPesaTokenBridge.deploy(
    CCIP_ROUTER,
    wbtcAddress
  );
  await tokenBridge.waitForDeployment();
  const tokenBridgeAddress = await tokenBridge.getAddress();
  console.log(`BitPesaTokenBridge deployed to: ${tokenBridgeAddress}`);
  
  // Set up supported chains for the token bridge
  console.log("\n--- Setting up token bridge ---");
  
  // Chain selectors for CCIP
  const ETH_SEPOLIA_SELECTOR = "16015286601757825753";
  const POLYGON_MUMBAI_SELECTOR = "12532609583862916517";
  
  console.log("\nAdding Ethereum Sepolia as supported chain...");
  let tx = await tokenBridge.addSupportedChain(ETH_SEPOLIA_SELECTOR);
  await tx.wait();
  
  console.log("Adding Polygon Mumbai as supported chain...");
  tx = await tokenBridge.addSupportedChain(POLYGON_MUMBAI_SELECTOR);
  await tx.wait();
  
  // Add liquidity to the lending platform
  console.log("\n--- Adding initial liquidity ---");
  
  // Approve USDC for the lending platform
  console.log("\nApproving USDC transfer...");
  const usdcAmount = ethers.parseUnits("1000", await mockUSDC.decimals()); // 1000 USDC
  tx = await mockUSDC.approve(lendingPlatformAddress, usdcAmount);
  await tx.wait();
  
  // Add liquidity
  console.log("Adding liquidity to lending platform...");
  tx = await lendingPlatform.addLiquidity(usdcAmount);
  await tx.wait();
  
  // Summary of deployment
  console.log("\n--- Deployment Summary ---");
  console.log(`MockWBTC Token:          ${wbtcAddress}`);
  console.log(`MockUSDC Token:          ${usdcAddress}`);
  console.log(`BitPesaPriceConsumer:    ${priceConsumerAddress}`);
  console.log(`BitPesaLending:          ${lendingPlatformAddress}`);
  console.log(`BitPesaTokenBridge:      ${tokenBridgeAddress}`);
  
  // Return addresses for potential use in scripts
  return {
    wbtcAddress,
    usdcAddress,
    priceConsumerAddress,
    lendingPlatformAddress,
    tokenBridgeAddress
  };
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
