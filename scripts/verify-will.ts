import { ethers, run } from "hardhat";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
    // Get the contract address and contract path
    const contractAddress = "0xF15badC6a01678972834F39D00808299Ff6406f1";
    const contractPath = "contracts/BitPesaWill.sol:BitPesaWill";

    const [deployer] = await ethers.getSigners();

    const contractConstructorArgs = process.env.CONSTRUCTOR_ARGS ? 
        JSON.parse(process.env.CONSTRUCTOR_ARGS) : 
        [
            process.env.WBTC_ADDRESS_SUPPORTED!, // WBTC address on Avalanche Fuji
            deployer.address,
            false,            
            deployer.address
        ];

    if (!contractAddress || !contractPath) {
        console.error(`
Error: Missing required environment variables.
Please set the following environment variables:
- CONTRACT_ADDRESS: The address of the contract to verify
- CONTRACT_PATH: The path to the contract (e.g., "contracts/BitPesaWill.sol:BitPesaWill")
        `);
        process.exit(1);
    }

    // Check if the contract path includes the contract name
    let contractFullPath = contractPath;
    if (!contractPath.includes(':')) {
        const pathParts = contractPath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const contractName = fileName.replace('.sol', '');
        contractFullPath = `${contractPath}:${contractName}`;
    }

    console.log(`Verifying BitPesaWill contract at ${contractAddress}...`);
    console.log(`Using contract path: ${contractFullPath}`);
    console.log(`Constructor Arguments:`, contractConstructorArgs);

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
