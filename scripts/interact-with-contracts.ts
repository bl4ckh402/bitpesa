import { ethers } from "hardhat";

async function main() {
  // Replace with your actual deployed contract addresses
  const bitPesaLendingAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
  const bitPesaPriceConsumerAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
  const bitPesaTokenBridgeAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
  
  // Get contract factories
  const BitPesaLending = await ethers.getContractFactory("BitPesaLending");
  const BitPesaPriceConsumer = await ethers.getContractFactory("BitPesaPriceConsumer");
  const BitPesaTokenBridge = await ethers.getContractFactory("BitPesaTokenBridge");
  
  // Connect to deployed contracts
  const lending = BitPesaLending.attach(bitPesaLendingAddress);
  const priceConsumer = BitPesaPriceConsumer.attach(bitPesaPriceConsumerAddress);
  const tokenBridge = BitPesaTokenBridge.attach(bitPesaTokenBridgeAddress);
  
  // Example: Get the latest BTC/USD price
  console.log("Getting BTC/USD price...");
  const price = await priceConsumer.getLatestPrice();
  const decimals = await priceConsumer.getPriceDecimals();
  console.log(`Current BTC/USD Price: $${ethers.formatUnits(price, decimals)}`);
  
  // Example: Get collateral ratio from lending contract
  console.log("\nGetting lending parameters...");
  const collateralRatio = await lending.requiredCollateralRatio();
  console.log(`Required Collateral Ratio: ${collateralRatio}%`);
  const liquidationThreshold = await lending.liquidationThreshold();
  console.log(`Liquidation Threshold: ${liquidationThreshold}%`);
  
  // Example: Get supported chains from bridge contract
  console.log("\nSetting up supported chains for token bridge...");
  
  // Ethereum Sepolia testnet chain selector for CCIP
  const ETH_SEPOLIA_SELECTOR = "16015286601757825753";
  
  // Add Ethereum Sepolia as supported chain (only if not already supported)
  const isSupportedBefore = await tokenBridge.supportedChains(ETH_SEPOLIA_SELECTOR);
  
  if (!isSupportedBefore) {
    console.log(`Adding Ethereum Sepolia (${ETH_SEPOLIA_SELECTOR}) as supported chain...`);
    const tx = await tokenBridge.addSupportedChain(ETH_SEPOLIA_SELECTOR);
    await tx.wait();
    console.log("Chain added successfully!");
  } else {
    console.log(`Ethereum Sepolia (${ETH_SEPOLIA_SELECTOR}) is already a supported chain`);
  }
  
  // Verify chain is now supported
  const isSupportedAfter = await tokenBridge.supportedChains(ETH_SEPOLIA_SELECTOR);
  console.log(`Is Ethereum Sepolia supported now? ${isSupportedAfter}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
