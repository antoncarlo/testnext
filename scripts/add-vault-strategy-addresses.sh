#!/bin/bash

# Add Vault and Strategy Contract Addresses to Vercel
# Author: Anton Carlo Santoro
# Date: 27 November 2024
#
# Usage:
#   ./add-vault-strategy-addresses.sh <VAULT_ADDRESS> <STRATEGY_ADDRESS>
#
# Example:
#   ./add-vault-strategy-addresses.sh 0x1234...5678 0xabcd...ef01

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Adding Vault and Strategy Addresses to Vercel${NC}"
echo "=========================================================="
echo ""

# Check arguments
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No addresses provided. Usage:${NC}"
    echo ""
    echo "  ./add-vault-strategy-addresses.sh <VAULT_ADDRESS> <STRATEGY_ADDRESS>"
    echo ""
    echo "Example:"
    echo "  ./add-vault-strategy-addresses.sh 0x1234567890abcdef1234567890abcdef12345678 0xabcdef1234567890abcdef1234567890abcdef12"
    echo ""
    exit 1
fi

VAULT_ADDRESS=$1
STRATEGY_ADDRESS=$2

# Validate addresses (basic check for 0x prefix and length)
if [[ ! $VAULT_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${RED}❌ Invalid VAULT_ADDRESS format. Must be 0x followed by 40 hex characters.${NC}"
    exit 1
fi

if [ -n "$STRATEGY_ADDRESS" ] && [[ ! $STRATEGY_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${RED}❌ Invalid STRATEGY_ADDRESS format. Must be 0x followed by 40 hex characters.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Addresses validated${NC}"
echo ""
echo "  VAULT_ADDRESS:    $VAULT_ADDRESS"
if [ -n "$STRATEGY_ADDRESS" ]; then
    echo "  STRATEGY_ADDRESS: $STRATEGY_ADDRESS"
fi
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Login to Vercel (if needed)
echo -e "${BLUE}🔐 Checking Vercel authentication...${NC}"
vercel whoami || vercel login

echo ""
echo -e "${BLUE}📝 Adding VITE_VAULT_ADDRESS...${NC}"
echo ""

# Add VITE_VAULT_ADDRESS to all environments
echo "$VAULT_ADDRESS" | vercel env add VITE_VAULT_ADDRESS production 2>&1 | grep -v "Error: The variable" || true
echo "$VAULT_ADDRESS" | vercel env add VITE_VAULT_ADDRESS preview 2>&1 | grep -v "Error: The variable" || true
echo "$VAULT_ADDRESS" | vercel env add VITE_VAULT_ADDRESS development 2>&1 | grep -v "Error: The variable" || true

echo -e "${GREEN}✅ VITE_VAULT_ADDRESS added to all environments${NC}"
echo ""

# Add VITE_STRATEGY_ADDRESS if provided
if [ -n "$STRATEGY_ADDRESS" ]; then
    echo -e "${BLUE}📝 Adding VITE_STRATEGY_ADDRESS...${NC}"
    echo ""
    
    echo "$STRATEGY_ADDRESS" | vercel env add VITE_STRATEGY_ADDRESS production 2>&1 | grep -v "Error: The variable" || true
    echo "$STRATEGY_ADDRESS" | vercel env add VITE_STRATEGY_ADDRESS preview 2>&1 | grep -v "Error: The variable" || true
    echo "$STRATEGY_ADDRESS" | vercel env add VITE_STRATEGY_ADDRESS development 2>&1 | grep -v "Error: The variable" || true
    
    echo -e "${GREEN}✅ VITE_STRATEGY_ADDRESS added to all environments${NC}"
    echo ""
fi

# Update .env.local
echo -e "${BLUE}📝 Updating .env.local...${NC}"
echo ""

if grep -q "VITE_VAULT_ADDRESS=" .env.local; then
    # Update existing
    sed -i "s|VITE_VAULT_ADDRESS=.*|VITE_VAULT_ADDRESS=\"$VAULT_ADDRESS\"|g" .env.local
    echo -e "${GREEN}✅ Updated VITE_VAULT_ADDRESS in .env.local${NC}"
else
    # Add new
    echo "VITE_VAULT_ADDRESS=\"$VAULT_ADDRESS\"" >> .env.local
    echo -e "${GREEN}✅ Added VITE_VAULT_ADDRESS to .env.local${NC}"
fi

if [ -n "$STRATEGY_ADDRESS" ]; then
    if grep -q "VITE_STRATEGY_ADDRESS=" .env.local; then
        # Update existing
        sed -i "s|VITE_STRATEGY_ADDRESS=.*|VITE_STRATEGY_ADDRESS=\"$STRATEGY_ADDRESS\"|g" .env.local
        echo -e "${GREEN}✅ Updated VITE_STRATEGY_ADDRESS in .env.local${NC}"
    else
        # Add new
        echo "VITE_STRATEGY_ADDRESS=\"$STRATEGY_ADDRESS\"" >> .env.local
        echo -e "${GREEN}✅ Added VITE_STRATEGY_ADDRESS to .env.local${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Configuration complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "   - VITE_VAULT_ADDRESS: $VAULT_ADDRESS"
if [ -n "$STRATEGY_ADDRESS" ]; then
    echo "   - VITE_STRATEGY_ADDRESS: $STRATEGY_ADDRESS"
fi
echo "   - Environments: production, preview, development"
echo "   - .env.local updated"
echo ""
echo -e "${YELLOW}🔄 Next steps:${NC}"
echo "   1. Commit changes (optional, .env.local is gitignored)"
echo "   2. Redeploy on Vercel: git push origin main"
echo "   3. Or trigger manual redeploy in Vercel Dashboard"
echo ""
echo -e "${BLUE}🔗 Verify in Vercel Dashboard:${NC}"
echo "   https://vercel.com/anton-carlo-santoros-projects-ef8088b3/testnext/settings/environment-variables"
echo ""
