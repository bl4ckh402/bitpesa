import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();
  const { ethers } = hre;

  console.log(`Deploying contracts with account: ${deployer}`);

  // First deploy mock tokens
  console.log("Deploying mock tokens...");

  // Deploy MockWBTC
  const mockWBTC = await deploy("MockWBTC", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`MockWBTC deployed to ${mockWBTC.address}`);

  // Deploy MockUSDC
  const mockUSDC = await deploy("MockUSDC", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`MockUSDC deployed to ${mockUSDC.address}`);

  // Addresses for Chainlink on Avalanche Fuji Testnet
  const AVALANCHE_FUJI_BTC_USD_PRICE_FEED = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a"; // Chainlink BTC/USD on Fuji
  const AVALANCHE_FUJI_CCIP_ROUTER = "0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8"; // Chainlink CCIP Router on Fuji

  // Deploy the price consumer
  const priceConsumer = await deploy("BitPesaPriceConsumer", {
    from: deployer,
    args: [AVALANCHE_FUJI_BTC_USD_PRICE_FEED],
    log: true,
  });

  console.log(`BitPesaPriceConsumer deployed to ${priceConsumer.address}`);

  // Deploy the lending platform
  const lendingPlatform = await deploy("BitPesaLending", {
    from: deployer,
    args: [mockWBTC.address, mockUSDC.address, AVALANCHE_FUJI_BTC_USD_PRICE_FEED],
    log: true,
  });

  console.log(`BitPesaLending deployed to ${lendingPlatform.address}`);

  // Deploy the token bridge
  const tokenBridge = await deploy("BitPesaTokenBridge", {
    from: deployer,
    args: [AVALANCHE_FUJI_CCIP_ROUTER, mockWBTC.address],
    log: true,
  });

  console.log(`BitPesaTokenBridge deployed to ${tokenBridge.address}`);

  // Set up supported chains for token bridge
  if (hre.network.name !== "hardhat") {
    console.log("Setting up token bridge...");
    
    // Get the contract
    const tokenBridgeContract = await ethers.getContractAt("BitPesaTokenBridge", tokenBridge.address);
    
    // Add supported chains
    const ETH_SEPOLIA_SELECTOR = "16015286601757825753";
    const POLYGON_MUMBAI_SELECTOR = "12532609583862916517";
    
    console.log("Adding Ethereum Sepolia as supported chain...");
    await tokenBridgeContract.addSupportedChain(ETH_SEPOLIA_SELECTOR);
    
    console.log("Adding Polygon Mumbai as supported chain...");
    await tokenBridgeContract.addSupportedChain(POLYGON_MUMBAI_SELECTOR);
    
    // Add initial liquidity to lending platform
    console.log("Adding initial liquidity to lending platform...");
    
    // Get the USDC contract
    const usdcContract = await ethers.getContractAt("MockUSDC", mockUSDC.address);
    
    // Approve and add liquidity
    const usdcDecimals = await usdcContract.decimals();
    const usdcAmount = ethers.parseUnits("1000", usdcDecimals);
    
    await usdcContract.approve(lendingPlatform.address, usdcAmount);
    
    const lendingContract = await ethers.getContractAt("BitPesaLending", lendingPlatform.address);
    await lendingContract.addLiquidity(usdcAmount);
    
    console.log("Added 1000 USDC liquidity to lending platform");
  }

  // Summary
  console.log("\nDeployment Summary:");
  console.log(`- MockWBTC: ${mockWBTC.address}`);
  console.log(`- MockUSDC: ${mockUSDC.address}`);
  console.log(`- BitPesaPriceConsumer: ${priceConsumer.address}`);
  console.log(`- BitPesaLending: ${lendingPlatform.address}`);
  console.log(`- BitPesaTokenBridge: ${tokenBridge.address}`);
};

func.tags = ["BitPesa"];

export default func;
