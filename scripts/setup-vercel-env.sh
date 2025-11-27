#!/bin/bash

# Setup Vercel Environment Variables for Base Chain
# Author: Anton Carlo Santoro
# Date: 27 November 2024

set -e

echo "🚀 Setting up Vercel Environment Variables for Base Chain"
echo "=========================================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel (if needed)
echo "🔐 Checking Vercel authentication..."
vercel whoami || vercel login

echo ""
echo "📦 Adding Base Chain Environment Variables..."
echo ""

# Function to add environment variable for all environments
add_env_all() {
    local key=$1
    local value=$2
    
    echo "📝 Adding: $key"
    
    # Add to production
    echo "$value" | vercel env add "$key" production 2>&1 | grep -v "Error: The variable" || true
    
    # Add to preview  
    echo "$value" | vercel env add "$key" preview 2>&1 | grep -v "Error: The variable" || true
    
    # Add to development
    echo "$value" | vercel env add "$key" development 2>&1 | grep -v "Error: The variable" || true
    
    echo "   ✅ Added to all environments"
    echo ""
}

# Network Configuration
add_env_all "VITE_NETWORK" "testnet"
add_env_all "VITE_BASE_CHAIN_ID" "84532"
add_env_all "VITE_BASE_RPC_URL" "https://mainnet.base.org"
add_env_all "VITE_BASE_SEPOLIA_RPC_URL" "https://sepolia.base.org"

# Base Chain Smart Contracts (Testnet)
add_env_all "VITE_NXB_TOKEN_ADDRESS" "0x0b678785BEA8664374eE6991714141d8E13C375a"
add_env_all "VITE_KYC_WHITELIST_ADDRESS" "0xc4Ca6299694383a9581f6ceAEfB02e674160bef5"
add_env_all "VITE_NAV_ORACLE_ADDRESS" "0x13AfcE4669642085b851319445E0F041698BE32e"
add_env_all "VITE_CCTP_RECEIVER_ADDRESS" "0xF0c206B7C434Df70b29DD030C40dE89752dbf287"
add_env_all "VITE_INSURANCE_POOL_TOKEN_ADDRESS" "0xE5438a2cB7DE27337040fA63F88F74FC11173302"
add_env_all "VITE_BASE_USDC_ADDRESS" "0x036CbD53842c5426634e7929541eC2318f3dCF7e"

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📋 Summary:"
echo "   - Network: Base Sepolia Testnet (Chain ID: 84532)"
echo "   - Contracts: 6/8 deployed (Vault and Strategy pending)"
echo "   - Configuration: 10 variables added to all environments"
echo ""
echo "⚠️  Note: VITE_VAULT_ADDRESS and VITE_STRATEGY_ADDRESS"
echo "   will need to be added after contract deployment"
echo ""
echo "🔄 Next steps:"
echo "   1. Redeploy on Vercel to apply changes: git push origin main"
echo "   2. Verify variables in Vercel Dashboard"
echo "   3. Test the application"
echo ""
