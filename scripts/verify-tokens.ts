import { run } from "hardhat";

async function main() {
  // Get the token addresses from command line arguments or environment variables
  const wbtcAddress = process.env.WBTC_ADDRESS;
  const usdcAddress = process.env.USDC_ADDRESS;
  
  if (!wbtcAddress || !usdcAddress) {
    console.error("Please provide token addresses as environment variables WBTC_ADDRESS and USDC_ADDRESS");
    process.exit(1);
  }
  
  console.log("Starting verification of token contracts...");
    // Verify WBTC
  console.log(`Verifying MockWBTC at ${wbtcAddress}...`);
  try {
    await run("verify:verify", {
      address: wbtcAddress,
      constructorArguments: [],
      contract: "contracts/tokens/MockWBTC.sol:MockWBTC"
    });
    console.log("MockWBTC verified successfully!");
  } catch (error) {
    console.error("Error verifying MockWBTC:", error);
  }
  
  // Verify USDC
  console.log(`Verifying MockUSDC at ${usdcAddress}...`);
  try {
    await run("verify:verify", {
      address: usdcAddress,
      constructorArguments: [],
      contract: "contracts/tokens/MockUSDC.sol:MockUSDC"
    });
    console.log("MockUSDC verified successfully!");
  } catch (error) {
    console.error("Error verifying MockUSDC:", error);
  }
  
  console.log("Token verification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
