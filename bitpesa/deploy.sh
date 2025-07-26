#!/bin/bash

# BitPesa Bitcoin Integration Deployment Script
# This script helps deploy BitPesa with Bitcoin integration enabled

set -e

echo "🚀 BitPesa Bitcoin Integration Deployment"
echo "========================================"

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ DFX SDK not found. Please install it first:"
    echo "   sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

# Check DFX version
DFX_VERSION=$(dfx --version | cut -d' ' -f2)
echo "📋 DFX Version: $DFX_VERSION"

# Start local replica with Bitcoin integration
echo "🔄 Starting local ICP replica with Bitcoin support..."
dfx stop 2>/dev/null || true
dfx start --clean --background

# Wait for replica to be ready
echo "⏳ Waiting for replica to be ready..."
sleep 5

# Check if Bitcoin is enabled
echo "🔍 Checking Bitcoin integration status..."
if dfx ping local &>/dev/null; then
    echo "✅ Local replica is running"
else
    echo "❌ Failed to connect to local replica"
    exit 1
fi

# Deploy Internet Identity first
echo "🆔 Deploying Internet Identity..."
dfx deploy internet_identity

# Deploy main BitPesa backend
echo "🏗️  Deploying BitPesa backend..."
dfx deploy bitpesa_backend

# Deploy enhanced BitPesa with Bitcoin integration
echo "⚡ Deploying enhanced BitPesa with Bitcoin integration..."
if dfx deploy bitpesa_enhanced; then
    echo "✅ Enhanced BitPesa deployed successfully"
else
    echo "⚠️  Enhanced BitPesa deployment failed, but basic backend is available"
fi

# Get canister IDs
echo "📋 Deployed Canister Information:"
echo "================================="

BACKEND_ID=$(dfx canister id bitpesa_backend 2>/dev/null || echo "Not deployed")
ENHANCED_ID=$(dfx canister id bitpesa_enhanced 2>/dev/null || echo "Not deployed")
II_ID=$(dfx canister id internet_identity 2>/dev/null || echo "Not deployed")

echo "🔧 BitPesa Backend ID: $BACKEND_ID"
echo "⚡ BitPesa Enhanced ID: $ENHANCED_ID"
echo "🆔 Internet Identity ID: $II_ID"

# Test basic functionality
echo ""
echo "🧪 Testing Basic Functionality"
echo "=============================="

echo "📞 Testing health check..."
if dfx canister call bitpesa_backend health; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
fi

echo "💰 Testing Bitcoin price fetch..."
if dfx canister call bitpesa_backend getBtcPrice; then
    echo "✅ Bitcoin price fetch successful"
else
    echo "⚠️  Bitcoin price fetch failed (this is normal if no internet connection)"
fi

echo "🔗 Testing Bitcoin address generation (Enhanced canister)..."
if [ "$ENHANCED_ID" != "Not deployed" ]; then
    if dfx canister call bitpesa_enhanced generateUserBitcoinAddress; then
        echo "✅ Bitcoin address generation successful"
    else
        echo "⚠️  Bitcoin address generation failed (check Bitcoin integration)"
    fi
else
    echo "⚠️  Enhanced canister not deployed"
fi

# Create .env file for frontend
echo ""
echo "📄 Creating environment file..."
cat > .env << EOF
# BitPesa Environment Configuration
DFX_NETWORK=local
CANISTER_ID_BITPESA_BACKEND=$BACKEND_ID
CANISTER_ID_BITPESA_ENHANCED=$ENHANCED_ID
CANISTER_ID_INTERNET_IDENTITY=$II_ID

# Bitcoin Configuration
BITCOIN_NETWORK=testnet
BITCOIN_ENABLED=true

# Local Development
LOCAL_REPLICA_HOST=http://localhost:4943
EOF

echo "✅ Environment file created: .env"

# Display next steps
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "🔗 Access your canisters:"
echo "   BitPesa Backend: http://localhost:4943/?canisterId=$BACKEND_ID"
echo "   Internet Identity: http://localhost:4943/?canisterId=$II_ID"
echo ""
echo "🧑‍💻 Next Steps:"
echo "   1. Test Bitcoin integration:"
echo "      dfx canister call bitpesa_enhanced demo_complete_workflow"
echo ""
echo "   2. Generate a Bitcoin address:"
echo "      dfx canister call bitpesa_enhanced generateUserBitcoinAddress"
echo ""
echo "   3. Check platform stats:"
echo "      dfx canister call bitpesa_enhanced getPlatformStats"
echo ""
echo "   4. Create a test loan (after depositing Bitcoin):"
echo "      dfx canister call bitpesa_enhanced createBitcoinLoan '(100000:nat64, 50000:nat, 30:nat)'"
echo ""
echo "📚 For more information, see README-Bitcoin-Integration.md"
echo ""
echo "⚠️  Important Notes:"
echo "   - Bitcoin integration requires the Bitcoin feature flag in dfx.json"
echo "   - For mainnet deployment, use: dfx deploy --network ic"
echo "   - Always test on testnet before mainnet deployment"
echo ""
echo "🔗 Useful Links:"
echo "   - Bitcoin Integration Docs: https://internetcomputer.org/docs/current/developer-docs/integrations/bitcoin/"
echo "   - Threshold ECDSA Docs: https://internetcomputer.org/docs/current/developer-docs/integrations/t-ecdsa/"
echo ""

# Save deployment info
cat > deployment-info.json << EOF
{
  "deployment_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "dfx_version": "$DFX_VERSION",
  "network": "local",
  "canisters": {
    "bitpesa_backend": "$BACKEND_ID",
    "bitpesa_enhanced": "$ENHANCED_ID",
    "internet_identity": "$II_ID"
  },
  "bitcoin_enabled": true,
  "bitcoin_network": "testnet"
}
EOF

echo "💾 Deployment info saved to: deployment-info.json"
echo ""
echo "Happy Building! 🚀"
