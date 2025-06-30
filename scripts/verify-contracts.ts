import { run } from "hardhat";

async function main() {
  console.log("Starting contract verification...");
  
  try {    // Contract addresses from deployment
    const bitPesaLendingAddress = "0x1502923fbe8f5E4f082c75CFa8081214c3a2DC54";
    // const bitPesaPriceConsumerAddress = "0x47F34f1F074DCEdc2bD1441848bd5b0786F031bD";
    // const bitPesaTokenBridgeAddress = "0xB4a9aAE8cF5557945eD7E2a0215EfadbD82f7Ba2";
    
    // Fuji testnet addresses
    const AVALANCHE_FUJI_WBTC = process.env.WBTC_ADDRESS_SUPPORTED || "0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4";
    const AVALANCHE_FUJI_USDC = process.env.USDC_ADDRESS || "0x5425890298aed601595a70AB815c96711a31Bc65";
    const AVALANCHE_FUJI_BTC_USD_PRICE_FEED = process.env.BTC_USD_PRICE_FEED || "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a";
    const AVALANCHE_FUJI_CCIP_ROUTER = process.env.CCIP_ROUTER || "0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8";

    // Verify BitPesaLending
    console.log("Verifying BitPesaLending...");
    await run("verify:verify", {
      address: bitPesaLendingAddress,
      constructorArguments: [
        AVALANCHE_FUJI_WBTC,
        AVALANCHE_FUJI_USDC,
        AVALANCHE_FUJI_BTC_USD_PRICE_FEED
      ],
    });
    
    // Verify BitPesaPriceConsumer
    // console.log("Verifying BitPesaPriceConsumer...");
    // await run("verify:verify", {
    //   address: bitPesaPriceConsumerAddress,
    //   constructorArguments: [AVALANCHE_FUJI_BTC_USD_PRICE_FEED],
    // });
    
    // // Verify BitPesaTokenBridge
    // console.log("Verifying BitPesaTokenBridge...");
    // await run("verify:verify", {
    //   address: bitPesaTokenBridgeAddress,
    //   constructorArguments: [AVALANCHE_FUJI_CCIP_ROUTER, AVALANCHE_FUJI_WBTC],
    // });
    
    console.log("All contracts verified!");
  } catch (error) {
    console.error("Error during verification:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
