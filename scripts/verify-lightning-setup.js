#!/usr/bin/env node

/**
 * Lightning Integration Verification Script
 * 
 * This script checks if all Lightning Network integration components 
 * are properly set up and configured.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 BitPesa Lightning Integration Verification');
console.log('===========================================\n');

const requiredFiles = [
  // Service and hooks
  'fe/lib/services/lightning-service.ts',
  'fe/lib/hooks/useLightningDeposit.ts',
  'fe/lib/utils/qr-code.ts',
  'fe/lib/utils/toast-utils.ts',
  
  // Components
  'fe/components/lightning-deposit.tsx',
  'fe/components/deposit-modal.tsx',
  
  // API endpoints
  'fe/app/api/webhooks/speed/route.ts',
  
  // Configuration
  '.env.example',
  '.env.local.example',
  
  // Documentation
  'LIGHTNING_INTEGRATION_GUIDE.md',
  'LIGHTNING_TESTING_GUIDE.md',
  
  // Scripts
  'scripts/demo-lightning.js',
];

const optionalFiles = [
  '.env.local',
  'fe/.env.local',
];

let missingFiles = [];
let presentFiles = [];

console.log('📂 Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    presentFiles.push(file);
    console.log(`✅ ${file}`);
  } else {
    missingFiles.push(file);
    console.log(`❌ ${file} (MISSING)`);
  }
});

console.log('\n📂 Checking optional files...');
optionalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} (configured)`);
  } else {
    console.log(`⚠️  ${file} (not configured - copy from .env.example)`);
  }
});

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
const packageJsonPath = path.join(process.cwd(), 'fe/package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = ['qrcode', '@types/qrcode', 'wagmi', 'viem', 'framer-motion'];
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep}: ${dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep}: NOT FOUND`);
    }
  });
} else {
  console.log('❌ fe/package.json not found');
}

// Check environment variables structure
console.log('\n🔧 Checking environment configuration...');
const envExamplePath = path.join(process.cwd(), '.env.example');
if (fs.existsSync(envExamplePath)) {
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SPEED_API_KEY',
    'NEXT_PUBLIC_SPEED_API_URL', 
    'SPEED_WEBHOOK_SECRET'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar} configured in .env.example`);
    } else {
      console.log(`❌ ${envVar} missing from .env.example`);
    }
  });
} else {
  console.log('❌ .env.example not found');
}

// Summary
console.log('\n📊 Summary');
console.log('===========');
console.log(`✅ Required files present: ${presentFiles.length}/${requiredFiles.length}`);
if (missingFiles.length > 0) {
  console.log(`❌ Missing files: ${missingFiles.length}`);
  console.log('Missing files:', missingFiles.join(', '));
}

console.log('\n🚀 Next Steps');
console.log('=============');

if (missingFiles.length === 0) {
  console.log('✅ All Lightning integration files are present!');
  console.log('\nTo complete setup:');
  console.log('1. Copy .env.local.example to .env.local');
  console.log('2. Update .env.local with your Speed API credentials');
  console.log('3. Run: cd fe && npm install');
  console.log('4. Run: cd fe && npm run dev');
  console.log('5. Test Lightning deposit in the UI');
  console.log('6. Use scripts/demo-lightning.js for API testing');
} else {
  console.log('❌ Some required files are missing.');
  console.log('Please ensure all Lightning integration components are created.');
}

console.log('\n📚 Documentation');
console.log('=================');
console.log('• Integration Guide: LIGHTNING_INTEGRATION_GUIDE.md');
console.log('• Testing Guide: LIGHTNING_TESTING_GUIDE.md');
console.log('• Demo Script: scripts/demo-lightning.js');

console.log('\n🔧 Troubleshooting');
console.log('==================');
console.log('• Check browser console for JavaScript errors');
console.log('• Verify Speed API credentials are correct');
console.log('• Ensure webhook endpoint is publicly accessible');
console.log('• Test with small amounts first (0.001 WBTC)');

console.log('\n🎯 Test Checklist');
console.log('=================');
console.log('□ Environment variables configured');
console.log('□ Dependencies installed (npm install)');
console.log('□ Development server running (npm run dev)');
console.log('□ Wallet connected');
console.log('□ Lightning wallet ready');
console.log('□ Create Lightning invoice');
console.log('□ Pay Lightning invoice'); 
console.log('□ Verify on-chain deposit');
console.log('□ Test error scenarios');

console.log('\n✨ Happy testing! ⚡');
