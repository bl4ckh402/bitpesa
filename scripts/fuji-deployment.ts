import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  console.log("Starting deployment to Avalanche Fuji Testnet...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  
  // Use previously deployed tokens or deploy new ones
  let AVALANCHE_FUJI_WBTC = process.env.WBTC_ADDRESS;
  let AVALANCHE_FUJI_USDC = process.env.USDC_ADDRESS;
  
  if (!AVALANCHE_FUJI_WBTC || !AVALANCHE_FUJI_USDC) {
    console.log("WBTC or USDC address not provided in environment variables. Deploying new tokens...");
    
    // Deploy MockWBTC
    console.log("Deploying MockWBTC...");
    const MockWBTC = await ethers.getContractFactory("MockWBTC");
    const wbtc = await MockWBTC.deploy();
    await wbtc.waitForDeployment();
    AVALANCHE_FUJI_WBTC = await wbtc.getAddress();
    console.log(`MockWBTC deployed to: ${AVALANCHE_FUJI_WBTC}`);
    console.log(`100 WBTC minted to: ${deployer.address}`);
    
    // Deploy MockUSDC
    console.log("Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    AVALANCHE_FUJI_USDC = await usdc.getAddress();
    console.log(`MockUSDC deployed to: ${AVALANCHE_FUJI_USDC}`);
    console.log(`1,000,000 USDC minted to: ${deployer.address}`);
  } else {
    console.log(`Using existing token addresses:`);
    console.log(`WBTC: ${AVALANCHE_FUJI_WBTC}`);
    console.log(`USDC: ${AVALANCHE_FUJI_USDC}`);
  }
  
  const AVALANCHE_FUJI_BTC_USD_PRICE_FEED = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a"; // Chainlink BTC/USD on Fuji
  const AVALANCHE_FUJI_CCIP_ROUTER = "0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8"; // Chainlink CCIP Router on Fuji
  
  // Get contract factories
  const BitPesaPriceConsumer = await ethers.getContractFactory("BitPesaPriceConsumer");
  const BitPesaLending = await ethers.getContractFactory("BitPesaLending");
  const BitPesaTokenBridge = await ethers.getContractFactory("BitPesaTokenBridge");
  
  // Deploy the contracts
  console.log("Deploying BitPesaPriceConsumer...");
  const priceConsumer = await BitPesaPriceConsumer.deploy(AVALANCHE_FUJI_BTC_USD_PRICE_FEED);
  await priceConsumer.waitForDeployment();
  const priceConsumerAddress = await priceConsumer.getAddress();
  console.log(`BitPesaPriceConsumer deployed to: ${priceConsumerAddress}`);
  
  console.log("Deploying BitPesaLending...");
  const lendingPlatform = await BitPesaLending.deploy(
    AVALANCHE_FUJI_WBTC,
    AVALANCHE_FUJI_USDC,
    AVALANCHE_FUJI_BTC_USD_PRICE_FEED
  );
  await lendingPlatform.waitForDeployment();
  const lendingPlatformAddress = await lendingPlatform.getAddress();
  console.log(`BitPesaLending deployed to: ${lendingPlatformAddress}`);
  
  console.log("Deploying BitPesaTokenBridge...");
  const tokenBridge = await BitPesaTokenBridge.deploy(
    AVALANCHE_FUJI_CCIP_ROUTER,
    AVALANCHE_FUJI_WBTC
  );
  await tokenBridge.waitForDeployment();
  const tokenBridgeAddress = await tokenBridge.getAddress();
  console.log(`BitPesaTokenBridge deployed to: ${tokenBridgeAddress}`);
  
  // Set up supported chains for the token bridge
  console.log("Setting up supported chains for token bridge...");
  
  // Chain selectors for CCIP
  const ETH_SEPOLIA_SELECTOR = "16015286601757825753";
  const POLYGON_MUMBAI_SELECTOR = "12532609583862916517";
  
  console.log("Adding Ethereum Sepolia as supported chain...");
  let tx = await tokenBridge.addSupportedChain(ETH_SEPOLIA_SELECTOR);
  await tx.wait();
    console.log("Adding Polygon Mumbai as supported chain...");
  tx = await tokenBridge.addSupportedChain(POLYGON_MUMBAI_SELECTOR);
  await tx.wait();
  // Add some initial liquidity to the lending platform
  console.log("Adding initial USDC liquidity to the lending platform...");
    // Get the contract factories for tokens
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  
  // Connect to tokens with correct interfaces
  const mockUSDC = await MockUSDC.attach(AVALANCHE_FUJI_USDC);
  
  // Approve USDC for the lending platform
  console.log("Approving USDC transfer...");
  const usdcAmount = ethers.parseUnits("1000", 18); // 1000 USDC with 18 decimals
  tx = await mockUSDC.approve(lendingPlatformAddress, usdcAmount);
  await tx.wait();
  
  // Add liquidity
  console.log("Adding liquidity to lending platform...");
  tx = await lendingPlatform.addLiquidity(usdcAmount);
  await tx.wait();
  
  console.log("Contract deployment and setup complete!");
  console.log({
    wbtcAddress: AVALANCHE_FUJI_WBTC,
    usdcAddress: AVALANCHE_FUJI_USDC,
    priceConsumerAddress,
    lendingPlatformAddress,
    tokenBridgeAddress
  });
  
  return {
    priceConsumerAddress,
    lendingPlatformAddress,
    tokenBridgeAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
