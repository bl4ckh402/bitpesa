import { run, ethers } from "hardhat";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  // Get the contract address and contract path from environment variables
  const contractAddress = "0x2AE4d05B0d150BCa0092b240dc26c5a8EDD0591c";
  const contractPath = "contracts/BitPesaTokenBridge.sol:BitPesaTokenBridge"; // Format: "contracts/path/Contract.sol:ContractName"  // Define constructor arguments for BitPesaTokenBridge
  // These are the addresses used during deployment according to deploy-ccip-token-bridge.ts
  // Avalanche Fuji network values
  const routerAddress = "0xF694E193200268f9a4868e4Aa017A0118C9a8177"; // Avalanche Fuji CCIP Router
  const linkAddress = "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846";  // LINK on Avalanche Fuji

  if (!contractAddress || !contractPath) {
    console.error(`
Error: Missing required environment variables.
Please set the following environment variables:
- CONTRACT_ADDRESS: The address of the contract to verify
- CONTRACT_PATH: The path to the contract (e.g., "contracts/BitPesaTokenBridge.sol:BitPesaTokenBridge")

Example usage:
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890 CONTRACT_PATH="contracts/BitPesaTokenBridge.sol:BitPesaTokenBridge" npx hardhat run scripts/verify-contract.ts --network avalancheFuji
    `);
    process.exit(1);
  }
  // Check if the contract path includes the contract name
  let contractFullPath = contractPath;
  if (!contractPath.includes(':')) {
    // Extract contract name from path
    const pathParts = contractPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const contractName = fileName.replace('.sol', '');
    contractFullPath = `${contractPath}:${contractName}`;
  }  // Use the defined constructor arguments or get them from environment variables
  const contractConstructorArgs = process.env.CONSTRUCTOR_ARGS ? 
    JSON.parse(process.env.CONSTRUCTOR_ARGS) : 
    [routerAddress, linkAddress];

  console.log(`Verifying contract at ${contractAddress}...`);
  console.log(`Using contract path: ${contractFullPath}`);
  console.log(`Constructor Arguments:`);
  console.log(`  Router Address: ${contractConstructorArgs[0]}`);
  console.log(`  LINK Address:   ${contractConstructorArgs[1]}`);
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: contractConstructorArgs,
      contract: contractFullPath
    });
    console.log("✅ Contract verified successfully!");
  } catch (error: any) {
    if (error?.message?.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Error verifying contract:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
