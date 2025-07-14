#!/usr/bin/env node

/**
 * Lightning Integration Demo Script
 * 
 * This script demonstrates how to create Lightning payments for collateral deposits
 * using the Speed platform API. Run this to test the integration.
 * 
 * Usage:
 *   node scripts/demo-lightning.js
 * 
 * Make sure to set your environment variables first:
 *   SPEED_API_KEY=sk_test_your_key
 *   SPEED_API_URL=https://api.tryspeed.com
 */

const https = require('https');

// Configuration
const SPEED_API_KEY = process.env.SPEED_API_KEY || 'sk_test_your_key_here';
const SPEED_API_URL = process.env.SPEED_API_URL || 'https://api.tryspeed.com';
const API_VERSION = '2022-10-15';

/**
 * Make HTTP request to Speed API
 */
function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SPEED_API_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(SPEED_API_KEY + ':').toString('base64')}`,
        'speed-version': API_VERSION,
      },
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${response.message || body}`));
          }
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Get current BTC price (simplified)
 */
async function getBtcPrice() {
  // In a real implementation, you'd fetch from a price API
  // For demo purposes, we'll use a fixed price
  return 50000; // $50,000 USD
}

/**
 * Create a Lightning payment for collateral deposit
 */
async function createLightningDeposit(wbtcAmount, userAddress) {
  try {
    console.log('🚀 Creating Lightning deposit payment...');
    console.log(`Amount: ${wbtcAmount} WBTC`);
    console.log(`User: ${userAddress}`);
    
    // Get BTC price
    const btcPrice = await getBtcPrice();
    const amountInUSD = parseFloat(wbtcAmount) * btcPrice;
    
    console.log(`BTC Price: $${btcPrice.toLocaleString()}`);
    console.log(`USD Value: $${amountInUSD.toLocaleString()}`);
    
    // Create payment request
    const paymentRequest = {
      currency: 'USD',
      amount: amountInUSD,
      target_currency: 'SATS',
      payment_methods: ['lightning'],
      ttl: 1800, // 30 minutes
      metadata: {
        type: 'collateral_deposit',
        user_address: userAddress,
        collateral_type: 'WBTC',
        original_amount: wbtcAmount,
        demo: true,
        timestamp: Date.now(),
      },
    };
    
    const payment = await makeRequest('/payments', 'POST', paymentRequest);
    
    console.log('✅ Payment created successfully!');
    console.log(`Payment ID: ${payment.id}`);
    console.log(`Status: ${payment.status}`);
    console.log(`Target Amount: ${payment.target_amount} sats`);
    console.log(`Expires At: ${new Date(payment.expires_at).toISOString()}`);
    
    if (payment.payment_method_options?.lightning) {
      const lightning = payment.payment_method_options.lightning;
      console.log('\n⚡ Lightning Payment Details:');
      console.log(`Lightning ID: ${lightning.id}`);
      console.log(`Invoice: ${lightning.payment_request}`);
      console.log('\n📱 To pay this invoice:');
      console.log('1. Open your Lightning wallet');
      console.log('2. Scan the QR code or paste the invoice');
      console.log('3. Confirm the payment');
      
      // In a real app, you'd generate a QR code here
      console.log('\n🔗 Invoice (copy to Lightning wallet):');
      console.log(lightning.payment_request);
    }
    
    return payment;
    
  } catch (error) {
    console.error('❌ Error creating Lightning payment:', error.message);
    throw error;
  }
}

/**
 * Check payment status
 */
async function checkPaymentStatus(paymentId) {
  try {
    console.log(`\n🔍 Checking payment status: ${paymentId}`);
    
    const payment = await makeRequest(`/payments/${paymentId}`);
    
    console.log(`Status: ${payment.status}`);
    console.log(`Target Amount: ${payment.target_amount} sats`);
    
    if (payment.target_amount_paid) {
      console.log(`Amount Paid: ${payment.target_amount_paid} sats`);
      console.log(`Paid At: ${new Date(payment.target_amount_paid_at).toISOString()}`);
    }
    
    return payment;
    
  } catch (error) {
    console.error('❌ Error checking payment status:', error.message);
    throw error;
  }
}

/**
 * Monitor payment until completion or timeout
 */
async function monitorPayment(paymentId, maxWaitTime = 30 * 60 * 1000) {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds
  
  console.log('\n⏰ Monitoring payment status...');
  console.log('Payment will be monitored for up to 30 minutes.');
  console.log('Press Ctrl+C to stop monitoring.\n');
  
  const monitor = setInterval(async () => {
    try {
      const payment = await makeRequest(`/payments/${paymentId}`);
      const elapsed = Date.now() - startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      console.log(`[${minutes}:${seconds.toString().padStart(2, '0')}] Status: ${payment.status}`);
      
      if (payment.status === 'paid') {
        clearInterval(monitor);
        console.log('\n🎉 Payment completed successfully!');
        console.log(`Amount received: ${payment.target_amount_paid} sats`);
        console.log('\n💰 Next steps:');
        console.log('1. Execute on-chain WBTC deposit');
        console.log('2. Update user collateral balance');
        console.log('3. Send confirmation notification');
        return;
      }
      
      if (payment.status === 'expired' || payment.status === 'cancelled') {
        clearInterval(monitor);
        console.log(`\n❌ Payment ${payment.status}`);
        return;
      }
      
      if (elapsed > maxWaitTime) {
        clearInterval(monitor);
        console.log('\n⏰ Monitoring timeout reached');
        return;
      }
      
    } catch (error) {
      console.error('Error during monitoring:', error.message);
    }
  }, pollInterval);
}

/**
 * Demo the complete Lightning deposit flow
 */
async function demoLightningDeposit() {
  try {
    console.log('🌟 BitPesa Lightning Deposit Demo');
    console.log('==================================\n');
    
    // Demo parameters
    const wbtcAmount = '0.001'; // 0.001 WBTC
    const userAddress = '0x742d35Cc6634C0532925a3b8D5C9C3F9D2E1234A'; // Demo address
    
    // Step 1: Create Lightning payment
    const payment = await createLightningDeposit(wbtcAmount, userAddress);
    
    // Step 2: Show payment details and instructions
    console.log('\n📋 What happens next:');
    console.log('1. User pays the Lightning invoice');
    console.log('2. Speed platform sends webhook notification');
    console.log('3. BitPesa executes on-chain WBTC deposit');
    console.log('4. User can start borrowing against collateral');
    
    // Step 3: Ask if user wants to monitor
    console.log('\n🤖 Demo Options:');
    console.log('A) Monitor payment status (recommended for testing)');
    console.log('B) Just show payment details and exit');
    console.log('C) Check existing payment status');
    
    // For demo, we'll just show the payment info
    console.log('\n✨ Demo completed! Payment created successfully.');
    console.log('\nTo test the complete flow:');
    console.log('1. Pay the Lightning invoice above');
    console.log('2. Check your webhook endpoint for notifications');
    console.log('3. Monitor the database for transaction updates');
    
    // Return payment info for further testing
    return {
      paymentId: payment.id,
      lightningInvoice: payment.payment_method_options?.lightning?.payment_request,
      expiresAt: payment.expires_at,
    };
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run demo
    await demoLightningDeposit();
  } else if (args[0] === 'status' && args[1]) {
    // Check payment status
    await checkPaymentStatus(args[1]);
  } else if (args[0] === 'monitor' && args[1]) {
    // Monitor payment
    await monitorPayment(args[1]);
  } else {
    console.log('Lightning Demo Usage:');
    console.log('  node demo-lightning.js                    # Run demo');
    console.log('  node demo-lightning.js status <payment-id>  # Check status');
    console.log('  node demo-lightning.js monitor <payment-id> # Monitor payment');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createLightningDeposit,
  checkPaymentStatus,
  monitorPayment,
};
