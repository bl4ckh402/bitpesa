import { ethers } from "hardhat";
import { MockWBTC, MockCCIPRouter, BitPesaTokenBridge } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// CCIP chain selectors for different networks
const CHAIN_SELECTORS = {
  ETHEREUM_SEPOLIA: "16015286601757825753",
  AVALANCHE_FUJI: "14767482510784806043",
  BASE_SEPOLIA: "10344971235874465080"
};

// CCIP Router and Link Token addresses per network
const CCIP_ROUTERS = {
  SEPOLIA: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  FUJI: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
  BASE_SEPOLIA: "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93"
};

const LINK_TOKENS = {
  SEPOLIA: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  FUJI: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
  BASE_SEPOLIA: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410"
};

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);


    const wbtcAddress = "0x1E3857fd780FD7ab35Ce19e37D6789bB5d45Ebd8";

    // Use the correct router and link addresses based on the network
    const networkName = (await ethers.provider.getNetwork()).name;
    let routerAddress: string;
    let linkAddress: string;

    if (networkName === "sepolia") {
      routerAddress = CCIP_ROUTERS.SEPOLIA;
      linkAddress = LINK_TOKENS.SEPOLIA;
    } else if (networkName === "avalancheFuji") {
      routerAddress = CCIP_ROUTERS.FUJI;
      linkAddress = LINK_TOKENS.FUJI;
    } else if (networkName === "base_sepolia") {
      routerAddress = CCIP_ROUTERS.BASE_SEPOLIA;
      linkAddress = LINK_TOKENS.BASE_SEPOLIA;
    } else {
      console.log("Using local mock router for testing");
      // Deploy a mock CCIP router for testing on local networks
      const MockCCIPRouter = await ethers.getContractFactory("MockCCIPRouter");
      const router = await MockCCIPRouter.deploy();
      await router.waitForDeployment();
      routerAddress = await router.getAddress();
      console.log(`MockCCIPRouter deployed to: ${routerAddress}`);

      // For local testing, we'll use the WBTC as a stand-in for LINK token too
      linkAddress = wbtcAddress;
    }

    // Deploy BitPesaTokenBridge with the router and tokens
    const BitPesaTokenBridge = await ethers.getContractFactory("BitPesaTokenBridge");
    const tokenBridge = await BitPesaTokenBridge.deploy(routerAddress, linkAddress);
    await tokenBridge.waitForDeployment();
    const tokenBridgeAddress = await tokenBridge.getAddress();
    console.log(`BitPesaTokenBridge deployed to: ${tokenBridgeAddress}`);

    // Configure supported chains
    if (networkName === "sepolia" || networkName === "hardhat" || networkName === "localhost") {
      await tokenBridge.addSupportedChain(BigInt(CHAIN_SELECTORS.AVALANCHE_FUJI));
      await tokenBridge.addSupportedChain(BigInt(CHAIN_SELECTORS.BASE_SEPOLIA));
      console.log("Supported chains added: Avalanche Fuji, Base Sepolia");
    } else if (networkName === "avalancheFuji") {
      await tokenBridge.addSupportedChain(BigInt(CHAIN_SELECTORS.ETHEREUM_SEPOLIA));
      await tokenBridge.addSupportedChain(BigInt(CHAIN_SELECTORS.BASE_SEPOLIA));
      console.log("Supported chains added: Ethereum Sepolia, Base Sepolia");
    } else if (networkName === "base_sepolia") {
      await tokenBridge.addSupportedChain(BigInt(CHAIN_SELECTORS.ETHEREUM_SEPOLIA));
      await tokenBridge.addSupportedChain(BigInt(CHAIN_SELECTORS.AVALANCHE_FUJI));
      console.log("Supported chains added: Ethereum Sepolia, Avalanche Fuji");
    }

    console.log("BitPesa Token Bridge deployment and configuration complete");
    
    // Fund the contract with ETH for CCIP fees
    if (networkName !== "hardhat" && networkName !== "localhost") {
      const fundTx = await deployer.sendTransaction({
        to: tokenBridgeAddress,
        value: ethers.parseEther("0.05") // 0.05 ETH
      });
      await fundTx.wait();
      console.log("Bridge funded with 0.05 ETH for CCIP fees");
    }
    
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
