import { ethers } from "ethers";

async function generateWallet() {
  // Generate a new wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log("Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);
  console.log("Mnemonic:", wallet.mnemonic?.phrase);
  
  console.log("\nRemember to fund this wallet with AVAX on Fuji testnet before deployment!");
  console.log("You can get testnet AVAX from the Avalanche Faucet: https://faucet.avax.network/");
}

generateWallet()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
