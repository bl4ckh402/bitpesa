import { ethers } from "hardhat";
import { MockWBTC, BitPesaWill } from "../typechain-types";

async function main() {
  console.log("Deploying and testing the enhanced BitPesaWill contract...");

  // Deploy MockWBTC
  const MockWBTC = await ethers.getContractFactory("MockWBTC");
  const wbtc = await MockWBTC.deploy();
  await wbtc.deployed();
  console.log(`MockWBTC deployed to: ${wbtc.address}`);

  // Get signers
  const [deployer, executor, user1, user2, user3] = await ethers.getSigners();
  console.log(`Using deployer account: ${deployer.address}`);
  console.log(`Using executor account: ${executor.address}`);

  // Deploy BitPesaWill
  const BitPesaWill = await ethers.getContractFactory("BitPesaWill");
  const will = await BitPesaWill.deploy(
    wbtc.address,    // WBTC token address
    executor.address, // Executor address
    true,            // Require executor approval
    deployer.address // KYC verifier
  );
  await will.deployed();
  console.log(`BitPesaWill deployed to: ${will.address}`);

  // Mint WBTC to user1
  const wbtcAmount = ethers.utils.parseUnits("5.0", 8); // 5 WBTC with 8 decimals
  await wbtc.mint(user1.address, wbtcAmount);
  console.log(`Minted ${ethers.utils.formatUnits(wbtcAmount, 8)} WBTC to ${user1.address}`);

  // Verify users
  await will.verifyUser(user1.address, "user1-kyc-reference");
  await will.verifyUser(user2.address, "user2-kyc-reference");
  await will.verifyUser(user3.address, "user3-kyc-reference");
  console.log("KYC verification completed for users");

  // Approve token spending
  const wbtcUser1 = wbtc.connect(user1);
  await wbtcUser1.approve(will.address, wbtcAmount);
  console.log(`User1 approved ${ethers.utils.formatUnits(wbtcAmount, 8)} WBTC for BitPesaWill contract`);

  // Create will for user1
  const willAmount = ethers.utils.parseUnits("1.0", 8); // 1 WBTC
  const inactivityPeriod = 60 * 60 * 24 * 30; // 30 days in seconds
  const metadataURI = "ipfs://will-metadata-hash";
  const willUser1 = will.connect(user1);

  // Create inactivity-based will
  const tx1 = await willUser1.createWill(
    willAmount,
    [user2.address, user3.address],  // Beneficiaries
    [5000, 5000],                    // 50% each (10000 = 100%)
    inactivityPeriod,                // 30 days inactivity
    metadataURI,                     // IPFS metadata
    0,                               // ReleaseCondition.INACTIVITY
    0,                               // No scheduled release time
    true,                            // Require verified beneficiaries
    "user1-kyc-reference"            // KYC reference
  );

  const receipt1 = await tx1.wait();
  const willCreatedEvent = receipt1.events?.find(e => e.event === "WillCreated");
  const willId1 = willCreatedEvent?.args?.willId;

  console.log(`Created will #${willId1} for user1 with ${ethers.utils.formatUnits(willAmount, 8)} WBTC`);
  console.log(`Will beneficiaries: ${user2.address} (50%), ${user3.address} (50%)`);

  // Create scheduled-release will
  const oneMonthFromNow = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
  const tx2 = await willUser1.createWill(
    willAmount,
    [user2.address],                 // Single beneficiary
    [10000],                         // 100%
    0,                               // No inactivity period 
    metadataURI,                     // IPFS metadata
    3,                               // ReleaseCondition.SCHEDULED_RELEASE
    oneMonthFromNow,                 // Release in one month
    true,                            // Require verified beneficiaries
    "user1-kyc-reference"            // KYC reference
  );

  const receipt2 = await tx2.wait();
  const willCreatedEvent2 = receipt2.events?.find(e => e.event === "WillCreated");
  const willId2 = willCreatedEvent2?.args?.willId;
  
  console.log(`Created scheduled-release will #${willId2} for user1 with ${ethers.utils.formatUnits(willAmount, 8)} WBTC`);
  console.log(`Will beneficiary: ${user2.address} (100%)`);
  console.log(`Will scheduled release date: ${new Date(oneMonthFromNow * 1000).toISOString()}`);

  // Register activity to reset the inactivity timer for will #1
  await willUser1.registerActivity(willId1);
  console.log(`Registered activity for will #${willId1}`);

  // Get will details
  const willDetails = await will.getWillDetails(willId1);
  console.log("\nWill #1 Details:");
  console.log(`Creator: ${willDetails.creator}`);
  console.log(`Amount: ${ethers.utils.formatUnits(willDetails.assetsAmount, 8)} WBTC`);
  console.log(`Beneficiaries: ${willDetails.beneficiaries.join(', ')}`);
  console.log(`Last Activity: ${new Date(willDetails.lastActivityTimestamp.toNumber() * 1000).toISOString()}`);
  console.log(`Inactivity Period: ${willDetails.inactivityPeriod.toNumber() / (24 * 60 * 60)} days`);
  console.log(`Release Condition: ${['INACTIVITY', 'MANUAL_EXECUTOR', 'DEATH_CERTIFICATE', 'SCHEDULED_RELEASE'][willDetails.releaseCondition]}`);

  // Simulate death certificate for a will (create new will)
  const tx3 = await willUser1.createWill(
    willAmount,
    [user3.address],                 // Single beneficiary
    [10000],                         // 100%
    0,                               // No inactivity period 
    "ipfs://death-certificate-will", // IPFS metadata
    2,                               // ReleaseCondition.DEATH_CERTIFICATE
    0,                               // No scheduled release time
    true,                            // Require verified beneficiaries
    "user1-kyc-reference"            // KYC reference
  );

  const receipt3 = await tx3.wait();
  const willCreatedEvent3 = receipt3.events?.find(e => e.event === "WillCreated");
  const willId3 = willCreatedEvent3?.args?.willId;
  
  console.log(`\nCreated death certificate will #${willId3} for user1`);
  
  // Validate a death certificate as KYC verifier
  await will.validateDeathCertificate(willId3, "ipfs://death-certificate-hash");
  console.log(`Validated death certificate for will #${willId3}`);
  
  // Execute the death certificate will by executor
  const executorWill = will.connect(executor);
  await executorWill.executeWill(willId3);
  console.log(`Executed will #${willId3} by executor`);
  
  // Check if execution worked
  const executedWillDetails = await will.getWillDetails(willId3);
  console.log(`Will #${willId3} executed: ${executedWillDetails.executed}`);
  
  // Check user3 balance after execution
  const user3Balance = await wbtc.balanceOf(user3.address);
  console.log(`User3 WBTC balance after will execution: ${ethers.utils.formatUnits(user3Balance, 8)} WBTC`);

  console.log("\nEnhanced BitPesaWill testing completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
