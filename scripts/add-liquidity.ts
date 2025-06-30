import { ethers } from "hardhat";

async function main() {
  console.log("Starting liquidity setup...");
  
  // Replace with your actual deployed contract address
  const bitPesaLendingAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
  
  // Get the account that will add liquidity
  const [liquidityProvider] = await ethers.getSigners();
  console.log(`Adding liquidity with account: ${liquidityProvider.address}`);
  
  // Get liquidity provider balance
  const balance = await ethers.provider.getBalance(liquidityProvider.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} AVAX`);
  
  // USDC contract on Avalanche Fuji
  const usdcAddress = "0x5425890298aed601595a70AB815c96711a31Bc65";
  
  // Contract ABIs
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function transfer(address to, uint amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)"
  ];
  
  const bitPesaLendingAbi = [
    "function addLiquidity(uint256 amount) external",
    "function platformStablecoinBalance() external view returns (uint256)"
  ];
  
  // Connect to contracts
  const usdc = new ethers.Contract(usdcAddress, erc20Abi, liquidityProvider);
  const lending = new ethers.Contract(bitPesaLendingAddress, bitPesaLendingAbi, liquidityProvider);
  
  // Check USDC balance
  const usdcDecimals = await usdc.decimals();
  const usdcSymbol = await usdc.symbol();
  const usdcBalance = await usdc.balanceOf(liquidityProvider.address);
  console.log(`${usdcSymbol} balance: ${ethers.formatUnits(usdcBalance, usdcDecimals)}`);
  
  if (usdcBalance.eq(0)) {
    console.log("No USDC balance. Please acquire test USDC before proceeding.");
    return;
  }
  
  // Amount to add as liquidity (50% of available balance)
  const liquidityAmount = usdcBalance / 2n;
  console.log(`Adding ${ethers.formatUnits(liquidityAmount, usdcDecimals)} ${usdcSymbol} as liquidity...`);
  
  // Approve spending of USDC by the lending contract
  console.log("Approving USDC spend...");
  const approveTx = await usdc.approve(bitPesaLendingAddress, liquidityAmount);
  await approveTx.wait();
  console.log(`Approval transaction: ${approveTx.hash}`);
  
  // Add liquidity
  console.log("Adding liquidity...");
  const addLiquidityTx = await lending.addLiquidity(liquidityAmount);
  await addLiquidityTx.wait();
  console.log(`Add liquidity transaction: ${addLiquidityTx.hash}`);
  
  // Check platform liquidity
  const platformLiquidity = await lending.platformStablecoinBalance();
  console.log(`Platform liquidity after deposit: ${ethers.formatUnits(platformLiquidity, usdcDecimals)} ${usdcSymbol}`);
  
  console.log("Liquidity setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
