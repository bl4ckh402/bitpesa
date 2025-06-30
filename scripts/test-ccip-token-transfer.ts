import { ethers } from "hardhat";
import { BitPesaTokenBridge } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Address } from "hardhat-deploy/types";

// CCIP chain selectors for different networks
const CHAIN_SELECTORS = {
  ETHEREUM_SEPOLIA: "16015286601757825753",
  AVALANCHE_FUJI: "14767482510784806043",
  BASE_SEPOLIA: "10344971235874465080"
};

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    const receiverWallet = new ethers.Wallet(process.env.RECEIVER_PRIVATE_KEY || "").connect(ethers.provider);
    console.log(`Testing with the account: ${deployer.address}`);
    console.log(`Receiver address: ${receiverWallet.address}`);


    const tokenBridgeAddress = process.env.TOKEN_BRIDGE_ADDRESS;
    const wbtcAddress = process.env.WBTC_ADDRESS_SUPPORTED;

    if (!tokenBridgeAddress || !wbtcAddress) {
      throw new Error("Please set TOKEN_BRIDGE_ADDRESS and WBTC_ADDRESS_SUPPORTED in your environment variables");
    }    

    const tokenBridge = await ethers.getContractAt("BitPesaTokenBridge", tokenBridgeAddress);
    
    const wbtc = await ethers.getContractAt("IWBTC", wbtcAddress);

    
    const transferAmount = ethers.parseUnits("0.01", 18);

    const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS;

    if (!linkTokenAddress) {
      throw new Error("Please set LINK_TOKEN_ADDRESS in your environment variables");
    }

    const linkToken = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", linkTokenAddress);

    
    const destinationChainSelector = BigInt(CHAIN_SELECTORS.BASE_SEPOLIA);

    console.log(`Destination chain selector: ${destinationChainSelector}`); // This should match the chain selector for Avalanche Fuji
      // Fund the token bridge with Link for fees first
    const linkBalanceBefore = await linkToken.balanceOf(deployer.address);
    console.log(`LINK balance before funding: ${ethers.formatUnits(linkBalanceBefore, 18)}`);

    console.log(`Transferring ${ethers.formatUnits(transferAmount, 18)} WBTC to Avalanche Fuji...`);    // Use the contract object directly to call the function
    // The contract will calculate fees internally and use LINK token for fees
    const transferTx = await tokenBridge.transferTokensPayLink(
      destinationChainSelector,
      receiverWallet.address,
      wbtcAddress,
      transferAmount
    );
    
    const receipt = await transferTx.wait();
    
    // Log the transaction details
    console.log(`Transaction hash: ${receipt?.hash}`);
    
    // Get any events from the transaction
    if (receipt && receipt.logs) {
      const iface = tokenBridge.interface;
      for (const log of receipt.logs) {
        try {
          const parsedLog = iface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          
          if (parsedLog && parsedLog.name === "TokensTransferred") {
            console.log("TokensTransferred event:");
            console.log(`  Message ID: ${parsedLog.args.messageId}`);
            console.log(`  Destination Chain: ${parsedLog.args.destinationChainSelector}`);
            console.log(`  Receiver: ${parsedLog.args.receiver}`);
            console.log(`  Token: ${parsedLog.args.token}`);
            console.log(`  Amount: ${ethers.formatUnits(parsedLog.args.amount, 18)}`);
          }
        } catch (e) {
          // This log wasn't from our contract or couldn't be parsed
        }
      }
    }
    
    // Get the balance after
    const balanceAfter = await wbtc.balanceOf(deployer.address);
    console.log(`WBTC balance after transfer: ${ethers.formatUnits(balanceAfter, 18)}`);
    
    console.log("Cross-chain token transfer initiated successfully!");
    console.log("Note: The tokens will arrive on the destination chain after the CCIP transaction is processed.");
    
  } catch (error) {
    console.error("Error during token transfer:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
