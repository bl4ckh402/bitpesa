import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy script for BitPesa custom tokens and platform
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying with account: ${deployer}`);
  console.log(`Network: ${hre.network.name}`);

  // First, deploy our mock tokens
  console.log("Deploying custom tokens...");
  
  // Deploy MockWBTC
  const mockWBTC = await deploy("MockWBTC", {
    from: deployer,
    args: [], // no constructor arguments
    log: true,
    autoMine: true,
  });
  
  console.log(`MockWBTC deployed to ${mockWBTC.address}`);
  
  // Deploy MockUSDC
  const mockUSDC = await deploy("MockUSDC", {
    from: deployer,
    args: [], // no constructor arguments
    log: true,
    autoMine: true,
  });
  
  console.log(`MockUSDC deployed to ${mockUSDC.address}`);

  // Save token addresses to be used later
  const WBTC_ADDRESS = mockWBTC.address;
  const USDC_ADDRESS = mockUSDC.address;
  
  // Addresses for Chainlink on Avalanche Fuji Testnet
  const AVALANCHE_FUJI_BTC_USD_PRICE_FEED = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a"; // Chainlink BTC/USD on Fuji
  const AVALANCHE_FUJI_CCIP_ROUTER = "0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8"; // Chainlink CCIP Router on Fuji
  
  // Deploy the price consumer
  console.log("Deploying BitPesaPriceConsumer...");
  const priceConsumer = await deploy("BitPesaPriceConsumer", {
    from: deployer,
    args: [AVALANCHE_FUJI_BTC_USD_PRICE_FEED],
    log: true,
    autoMine: true,
  });
  
  console.log(`BitPesaPriceConsumer deployed to ${priceConsumer.address}`);
  
  // Deploy the lending platform
  console.log("Deploying BitPesaLending...");
  const lendingPlatform = await deploy("BitPesaLending", {
    from: deployer,
    args: [WBTC_ADDRESS, USDC_ADDRESS, AVALANCHE_FUJI_BTC_USD_PRICE_FEED],
    log: true,
    autoMine: true,
  });
  
  console.log(`BitPesaLending deployed to ${lendingPlatform.address}`);
  
  // Deploy the token bridge
  console.log("Deploying BitPesaTokenBridge...");
  const tokenBridge = await deploy("BitPesaTokenBridge", {
    from: deployer,
    args: [AVALANCHE_FUJI_CCIP_ROUTER, WBTC_ADDRESS],
    log: true,
    autoMine: true,
  });
  
  console.log(`BitPesaTokenBridge deployed to ${tokenBridge.address}`);
  
  // Configure the platform
  if (hre.network.name !== "hardhat") {
    try {
      console.log("Setting up platform...");
      
      // Get contract instances
      const TokenBridge = await ethers.getContractAt("BitPesaTokenBridge", tokenBridge.address);
      const USDCToken = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);
      const Lending = await ethers.getContractAt("BitPesaLending", lendingPlatform.address);
      
      // Configure token bridge
      console.log("Configuring token bridge...");
      const ETH_SEPOLIA_SELECTOR = "16015286601757825753";
      const POLYGON_MUMBAI_SELECTOR = "12532609583862916517";
      
      await (await TokenBridge.addSupportedChain(ETH_SEPOLIA_SELECTOR)).wait();
      console.log("Added Ethereum Sepolia as supported chain");
      
      await (await TokenBridge.addSupportedChain(POLYGON_MUMBAI_SELECTOR)).wait();
      console.log("Added Polygon Mumbai as supported chain");
      
      // Add initial liquidity
      console.log("Adding initial liquidity...");
      const usdcAmount = ethers.parseUnits("10000", 6);
      await (await USDCToken.approve(lendingPlatform.address, usdcAmount)).wait();
      await (await Lending.addLiquidity(usdcAmount)).wait();
      console.log("Added 10,000 USDC as initial liquidity");
    } catch (error) {
      console.error("Error during platform setup:", error);
    }
  }
  
  // Final deployment summary
  console.log("\nDeployment Summary:");
  console.log("--------------------------------------------------");
  console.log(`WBTC Address: ${WBTC_ADDRESS}`);
  console.log(`USDC Address: ${USDC_ADDRESS}`);
  console.log(`BitPesaPriceConsumer: ${priceConsumer.address}`);
  console.log(`BitPesaLending: ${lendingPlatform.address}`);
  console.log(`BitPesaTokenBridge: ${tokenBridge.address}`);
  console.log("--------------------------------------------------");
  console.log("Add these to your .env file:");
  console.log(`WBTC_ADDRESS=${WBTC_ADDRESS}`);
  console.log(`USDC_ADDRESS=${USDC_ADDRESS}`);
  console.log("--------------------------------------------------");
  
  // Don't return addresses as DeployFunction must return Promise<boolean | void>
};

func.tags = ["BitPesa", "Tokens"];
export default func;
