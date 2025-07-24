/**
 * Setup Environment Script for ICP Integration
 * 
 * This script helps generate environment variables from dfx canister IDs
 * Run this script after deploying canisters with dfx
 * 
 * Usage:
 * node scripts/setup-icp-env.js
 */

const fs = require('fs');
const path = require('path');

function initCanisterEnv() {
  let localCanisters, prodCanisters;
  
  try {
    // Look for local canister IDs
    localCanisters = require(path.resolve('.dfx', 'local', 'canister_ids.json'));
  } catch (error) {
    console.log('No local canister_ids.json found');
  }
  
  try {
    // Look for production canister IDs
    prodCanisters = require(path.resolve('canister_ids.json'));
  } catch (error) {
    console.log('No production canister_ids.json found');
  }

  const network = process.env.DFX_NETWORK || 'local';
  
  // Create environment variables mapping
  const createEnvMap = (canisters, networkType) => {
    if (!canisters) return {};
    
    return Object.entries(canisters).reduce((prev, current) => {
      const [canisterName, canisterDetails] = current;
      const envKey = `NEXT_PUBLIC_${canisterName.toUpperCase()}_CANISTER_ID`;
      prev[envKey] = canisterDetails[networkType] || canisterDetails.local || canisterDetails.ic;
      return prev;
    }, {});
  };

  const localMap = createEnvMap(localCanisters, 'local');
  const prodMap = createEnvMap(prodCanisters, 'ic');

  return { localMap, prodMap };
}

function generateEnvFile(envMap, filename) {
  if (!envMap || Object.keys(envMap).length === 0) {
    console.log(`No environment variables to write for ${filename}`);
    return;
  }

  const envContent = Object.entries(envMap)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(filename, envContent);
  console.log(`Generated ${filename} with canister IDs`);
}

function main() {
  console.log('Setting up ICP environment variables...');
  
  const { localMap, prodMap } = initCanisterEnv();
  
  // Generate .env.development for local development
  if (Object.keys(localMap).length > 0) {
    generateEnvFile(localMap, '.env.development');
  }
  
  // Generate .env.production for production
  if (Object.keys(prodMap).length > 0) {
    generateEnvFile(prodMap, '.env.production');
  }
  
  // Generate a combined .env.local for development
  const combinedMap = { ...localMap };
  if (Object.keys(combinedMap).length > 0) {
    // Add some default values
    combinedMap['NEXT_PUBLIC_DFX_NETWORK'] = 'local';
    generateEnvFile(combinedMap, '.env.local');
  }
  
  console.log('Environment setup complete!');
  console.log('\nNext steps:');
  console.log('1. Review the generated .env files');
  console.log('2. Add any missing canister IDs manually');
  console.log('3. Restart your Next.js development server');
}

if (require.main === module) {
  main();
}

module.exports = { initCanisterEnv, generateEnvFile };
