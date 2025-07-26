#!/bin/bash

# BitPesa Chain Fusion - Production Deployment Script
# This script deploys the production-ready Chain Fusion lending system to IC mainnet

set -e

echo "🚀 BitPesa Chain Fusion - Production Deployment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CANISTER_NAME="bitpesa_chain_fusion_production"
NETWORK="ic"
MIN_CYCLES=5000000000000  # 5T cycles minimum

echo -e "${BLUE}Checking prerequisites...${NC}"

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo -e "${RED}❌ dfx is not installed. Please install dfx first.${NC}"
    exit 1
fi

# Check if we're using the right dfx version
DFX_VERSION=$(dfx --version | cut -d' ' -f2)
echo -e "${GREEN}✅ dfx version: $DFX_VERSION${NC}"

# Check identity
IDENTITY=$(dfx identity whoami)
PRINCIPAL=$(dfx identity get-principal)
echo -e "${GREEN}✅ Current identity: $IDENTITY${NC}"
echo -e "${GREEN}✅ Principal: $PRINCIPAL${NC}"

# Check cycle balance for mainnet deployment
echo -e "${BLUE}Checking cycle balance...${NC}"
if dfx wallet balance --network $NETWORK &> /dev/null; then
    BALANCE=$(dfx wallet balance --network $NETWORK | grep -o '[0-9,]*' | tr -d ',')
    echo -e "${GREEN}✅ Cycle balance: $BALANCE${NC}"
    
    if [ "$BALANCE" -lt "$MIN_CYCLES" ]; then
        echo -e "${RED}❌ Insufficient cycles. Need at least $MIN_CYCLES cycles for deployment.${NC}"
        echo -e "${YELLOW}💡 Get cycles from: https://faucet.dfinity.org/ or buy ICP and convert to cycles${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Could not check cycle balance. Proceeding anyway...${NC}"
fi

echo ""
echo -e "${BLUE}Starting deployment to $NETWORK...${NC}"

# Build the project
echo -e "${BLUE}Building project...${NC}"
if dfx build $CANISTER_NAME; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Deploy to mainnet
echo -e "${BLUE}Deploying to mainnet...${NC}"
if dfx deploy $CANISTER_NAME --network $NETWORK --with-cycles $MIN_CYCLES; then
    echo -e "${GREEN}✅ Deployment successful${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Get the canister ID
CANISTER_ID=$(dfx canister id $CANISTER_NAME --network $NETWORK)
echo -e "${GREEN}✅ Canister ID: $CANISTER_ID${NC}"

# Verify deployment with health check
echo -e "${BLUE}Verifying deployment...${NC}"
if dfx canister call $CANISTER_NAME healthCheck --network $NETWORK; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed, but canister is deployed${NC}"
fi

# Initialize the system
echo -e "${BLUE}Initializing system...${NC}"

# Set initial BTC price (placeholder - replace with oracle integration)
echo -e "${BLUE}Setting initial BTC price...${NC}"
if dfx canister call $CANISTER_NAME updateBtcPrice "(50000000000, principal \"$PRINCIPAL\")" --network $NETWORK; then
    echo -e "${GREEN}✅ BTC price initialized${NC}"
else
    echo -e "${YELLOW}⚠️  BTC price initialization failed${NC}"
fi

# Get system stats
echo -e "${BLUE}Getting system stats...${NC}"
dfx canister call $CANISTER_NAME getSystemStats --network $NETWORK

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "======================================"
echo -e "Canister Name: ${BLUE}$CANISTER_NAME${NC}"
echo -e "Canister ID: ${BLUE}$CANISTER_ID${NC}"
echo -e "Network: ${BLUE}$NETWORK${NC}"
echo -e "Dashboard: ${BLUE}https://dashboard.internetcomputer.org/canister/$CANISTER_ID${NC}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. 🔗 Integrate price oracle for real-time BTC prices"
echo "2. 🔐 Set up proper admin controls and access management"
echo "3. 📊 Implement monitoring and alerting"
echo "4. 🧪 Test with small amounts before full production use"
echo "5. 📖 Share the canister ID with users for interaction"
echo ""

echo -e "${BLUE}Quick Test Commands:${NC}"
echo "# Create user profile:"
echo "dfx canister call $CANISTER_NAME createUserProfile \"(principal \\\"$PRINCIPAL\\\")\" --network $NETWORK"
echo ""
echo "# Check user profile:"
echo "dfx canister call $CANISTER_NAME getUserProfile \"(principal \\\"$PRINCIPAL\\\")\" --network $NETWORK"
echo ""
echo "# Check system health:"
echo "dfx canister call $CANISTER_NAME healthCheck --network $NETWORK"
echo ""

echo -e "${GREEN}✨ BitPesa Chain Fusion is now live on IC mainnet!${NC}"
