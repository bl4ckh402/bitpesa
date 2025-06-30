import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment of BitPesaWill contract...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contract with the account: ${deployer.address}`);
  
  // Get WBTC address
  const AVALANCHE_FUJI_WBTC = process.env.WBTC_ADDRESS_SUPPORTED;
  
  if (!AVALANCHE_FUJI_WBTC) {
    throw new Error("WBTC address not provided in environment variables");
  }
  
  // Deploy BitPesaWill contract
  console.log("Deploying BitPesaWill...");
  const BitPesaWill = await ethers.getContractFactory("BitPesaWill");
  const will = await BitPesaWill.deploy(
    AVALANCHE_FUJI_WBTC,  // WBTC address
    deployer.address,     // Initial executor (can be changed later)
    false,                 // Initially don't require executor approval
    deployer.address       // Initial kycVerifier (can be changed later)
  );
  await will.waitForDeployment();
  const willAddress = await will.getAddress();
  console.log(`BitPesaWill deployed to: ${willAddress}`);
  
  console.log("\nDeployment completed successfully!");
  console.log("\nContract addresses:");
  console.log(`- BitPesaWill: ${willAddress}`);
  console.log(`- WBTC: ${AVALANCHE_FUJI_WBTC}`);

  // Add contract addresses to your environment variables
  console.log("\nAdd these to your .env file:");
  console.log(`WILL_ADDRESS=${willAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
