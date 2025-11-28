#!/bin/bash

# DeFiVault Utility Scripts
# Common operations for vault management

set -e

# Configuration
VAULT_ADDRESS="0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1"
TREASURY_ADDRESS="0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49"
RPC_URL="https://sepolia.base.org"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
wei_to_eth() {
    echo "scale=6; $1 / 1000000000000000000" | bc
}

eth_to_wei() {
    echo "scale=0; $1 * 1000000000000000000 / 1" | bc
}

print_header() {
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}=========================================${NC}"
}

# 1. Get vault info
get_vault_info() {
    print_header "Vault Information"
    
    echo "Vault Address: $VAULT_ADDRESS"
    echo "Treasury Address: $TREASURY_ADDRESS"
    echo "Network: Base Sepolia"
    echo ""
    
    # Get vault name
    VAULT_NAME=$(cast call $VAULT_ADDRESS "vaultName()(string)" --rpc-url $RPC_URL)
    echo "Vault Name: $VAULT_NAME"
    
    # Get owner
    OWNER=$(cast call $VAULT_ADDRESS "owner()(address)" --rpc-url $RPC_URL)
    echo "Owner: $OWNER"
    
    # Get treasury
    TREASURY=$(cast call $VAULT_ADDRESS "treasury()(address)" --rpc-url $RPC_URL)
    echo "Treasury: $TREASURY"
    
    # Get emergency mode
    EMERGENCY=$(cast call $VAULT_ADDRESS "emergencyMode()(bool)" --rpc-url $RPC_URL)
    echo "Emergency Mode: $EMERGENCY"
    
    echo ""
}

# 2. Get balances
get_balances() {
    print_header "Balances"
    
    # TVL
    TVL_WEI=$(cast call $VAULT_ADDRESS "totalValueLocked()(uint256)" --rpc-url $RPC_URL)
    TVL_ETH=$(wei_to_eth $TVL_WEI)
    echo "Total Value Locked: $TVL_ETH ETH"
    
    # Vault balance
    VAULT_BAL_WEI=$(cast balance $VAULT_ADDRESS --rpc-url $RPC_URL)
    VAULT_BAL_ETH=$(wei_to_eth $VAULT_BAL_WEI)
    echo "Vault Balance: $VAULT_BAL_ETH ETH"
    
    # Treasury balance
    TREASURY_BAL_WEI=$(cast balance $TREASURY_ADDRESS --rpc-url $RPC_URL)
    TREASURY_BAL_ETH=$(wei_to_eth $TREASURY_BAL_WEI)
    echo "Treasury Balance: $TREASURY_BAL_ETH ETH"
    
    echo ""
}

# 3. Get user balance
get_user_balance() {
    local USER_ADDRESS="$1"
    
    if [ -z "$USER_ADDRESS" ]; then
        echo "Usage: $0 user-balance <address>"
        exit 1
    fi
    
    print_header "User Balance"
    
    echo "User: $USER_ADDRESS"
    
    BALANCE_WEI=$(cast call $VAULT_ADDRESS \
        "getBalance(address)(uint256)" \
        $USER_ADDRESS \
        --rpc-url $RPC_URL)
    
    BALANCE_ETH=$(wei_to_eth $BALANCE_WEI)
    
    echo "Balance in Vault: $BALANCE_ETH ETH"
    echo ""
}

# 4. Simulate deposit
simulate_deposit() {
    local AMOUNT_ETH="$1"
    local USER_ADDRESS="$2"
    
    if [ -z "$AMOUNT_ETH" ] || [ -z "$USER_ADDRESS" ]; then
        echo "Usage: $0 simulate-deposit <amount_eth> <user_address>"
        exit 1
    fi
    
    print_header "Simulate Deposit"
    
    echo "User: $USER_ADDRESS"
    echo "Amount: $AMOUNT_ETH ETH"
    echo ""
    
    # Check emergency mode
    EMERGENCY=$(cast call $VAULT_ADDRESS "emergencyMode()(bool)" --rpc-url $RPC_URL)
    
    if [ "$EMERGENCY" = "true" ]; then
        echo -e "${YELLOW}⚠️  WARNING: Emergency mode is active. Deposits are blocked.${NC}"
        exit 1
    fi
    
    # Get current balance
    CURRENT_BAL_WEI=$(cast call $VAULT_ADDRESS \
        "getBalance(address)(uint256)" \
        $USER_ADDRESS \
        --rpc-url $RPC_URL)
    CURRENT_BAL_ETH=$(wei_to_eth $CURRENT_BAL_WEI)
    
    # Calculate new balance
    NEW_BAL_ETH=$(echo "$CURRENT_BAL_ETH + $AMOUNT_ETH" | bc)
    
    echo "Current Balance: $CURRENT_BAL_ETH ETH"
    echo "After Deposit: $NEW_BAL_ETH ETH"
    echo ""
    
    # Estimate gas
    AMOUNT_WEI=$(eth_to_wei $AMOUNT_ETH)
    
    echo "Estimating gas..."
    GAS_ESTIMATE=$(cast estimate $VAULT_ADDRESS \
        "deposit()" \
        --value $AMOUNT_WEI \
        --from $USER_ADDRESS \
        --rpc-url $RPC_URL 2>/dev/null || echo "Failed")
    
    if [ "$GAS_ESTIMATE" != "Failed" ]; then
        echo "Estimated Gas: $GAS_ESTIMATE"
        
        # Estimate cost (assuming 1 gwei gas price)
        GAS_COST_WEI=$(echo "$GAS_ESTIMATE * 1000000000" | bc)
        GAS_COST_ETH=$(wei_to_eth $GAS_COST_WEI)
        echo "Estimated Cost: ~$GAS_COST_ETH ETH (at 1 gwei)"
    else
        echo -e "${YELLOW}Could not estimate gas${NC}"
    fi
    
    echo ""
}

# 5. Simulate withdraw
simulate_withdraw() {
    local AMOUNT_ETH="$1"
    local USER_ADDRESS="$2"
    
    if [ -z "$AMOUNT_ETH" ] || [ -z "$USER_ADDRESS" ]; then
        echo "Usage: $0 simulate-withdraw <amount_eth> <user_address>"
        exit 1
    fi
    
    print_header "Simulate Withdrawal"
    
    echo "User: $USER_ADDRESS"
    echo "Amount: $AMOUNT_ETH ETH"
    echo ""
    
    # Get current balance
    CURRENT_BAL_WEI=$(cast call $VAULT_ADDRESS \
        "getBalance(address)(uint256)" \
        $USER_ADDRESS \
        --rpc-url $RPC_URL)
    CURRENT_BAL_ETH=$(wei_to_eth $CURRENT_BAL_WEI)
    
    # Check if sufficient balance
    if (( $(echo "$AMOUNT_ETH > $CURRENT_BAL_ETH" | bc -l) )); then
        echo -e "${YELLOW}⚠️  ERROR: Insufficient balance${NC}"
        echo "Requested: $AMOUNT_ETH ETH"
        echo "Available: $CURRENT_BAL_ETH ETH"
        exit 1
    fi
    
    # Calculate new balance
    NEW_BAL_ETH=$(echo "$CURRENT_BAL_ETH - $AMOUNT_ETH" | bc)
    
    echo "Current Balance: $CURRENT_BAL_ETH ETH"
    echo "After Withdrawal: $NEW_BAL_ETH ETH"
    echo ""
    
    # Estimate gas
    AMOUNT_WEI=$(eth_to_wei $AMOUNT_ETH)
    
    echo "Estimating gas..."
    GAS_ESTIMATE=$(cast estimate $VAULT_ADDRESS \
        "withdraw(uint256)" \
        $AMOUNT_WEI \
        --from $USER_ADDRESS \
        --rpc-url $RPC_URL 2>/dev/null || echo "Failed")
    
    if [ "$GAS_ESTIMATE" != "Failed" ]; then
        echo "Estimated Gas: $GAS_ESTIMATE"
        
        GAS_COST_WEI=$(echo "$GAS_ESTIMATE * 1000000000" | bc)
        GAS_COST_ETH=$(wei_to_eth $GAS_COST_WEI)
        echo "Estimated Cost: ~$GAS_COST_ETH ETH (at 1 gwei)"
    else
        echo -e "${YELLOW}Could not estimate gas${NC}"
    fi
    
    echo ""
}

# 6. Check transaction
check_transaction() {
    local TX_HASH="$1"
    
    if [ -z "$TX_HASH" ]; then
        echo "Usage: $0 check-tx <tx_hash>"
        exit 1
    fi
    
    print_header "Transaction Details"
    
    echo "Transaction: $TX_HASH"
    echo ""
    
    # Get transaction receipt
    cast receipt $TX_HASH --rpc-url $RPC_URL
    
    echo ""
    echo "View on BaseScan:"
    echo "https://sepolia.basescan.org/tx/$TX_HASH"
    echo ""
}

# 7. Export data
export_data() {
    local OUTPUT_FILE="${1:-vault_data_$(date +%Y%m%d_%H%M%S).json}"
    
    print_header "Export Vault Data"
    
    echo "Exporting to: $OUTPUT_FILE"
    
    # Get all data
    VAULT_NAME=$(cast call $VAULT_ADDRESS "vaultName()(string)" --rpc-url $RPC_URL)
    OWNER=$(cast call $VAULT_ADDRESS "owner()(address)" --rpc-url $RPC_URL)
    TREASURY=$(cast call $VAULT_ADDRESS "treasury()(address)" --rpc-url $RPC_URL)
    EMERGENCY=$(cast call $VAULT_ADDRESS "emergencyMode()(bool)" --rpc-url $RPC_URL)
    TVL_WEI=$(cast call $VAULT_ADDRESS "totalValueLocked()(uint256)" --rpc-url $RPC_URL)
    TVL_ETH=$(wei_to_eth $TVL_WEI)
    VAULT_BAL_WEI=$(cast balance $VAULT_ADDRESS --rpc-url $RPC_URL)
    VAULT_BAL_ETH=$(wei_to_eth $VAULT_BAL_WEI)
    TREASURY_BAL_WEI=$(cast balance $TREASURY_ADDRESS --rpc-url $RPC_URL)
    TREASURY_BAL_ETH=$(wei_to_eth $TREASURY_BAL_WEI)
    
    # Create JSON
    cat > $OUTPUT_FILE << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "vault": {
    "address": "$VAULT_ADDRESS",
    "name": "$VAULT_NAME",
    "owner": "$OWNER",
    "treasury": "$TREASURY",
    "emergencyMode": $EMERGENCY,
    "totalValueLocked": {
      "wei": "$TVL_WEI",
      "eth": "$TVL_ETH"
    },
    "balance": {
      "wei": "$VAULT_BAL_WEI",
      "eth": "$VAULT_BAL_ETH"
    }
  },
  "treasury": {
    "address": "$TREASURY_ADDRESS",
    "balance": {
      "wei": "$TREASURY_BAL_WEI",
      "eth": "$TREASURY_BAL_ETH"
    }
  },
  "network": {
    "name": "Base Sepolia",
    "chainId": 84532,
    "rpcUrl": "$RPC_URL"
  }
}
EOF
    
    echo -e "${GREEN}✓ Data exported successfully${NC}"
    echo ""
}

# Main
case "${1:-}" in
    "info")
        get_vault_info
        ;;
    "balances")
        get_balances
        ;;
    "user-balance")
        get_user_balance "$2"
        ;;
    "simulate-deposit")
        simulate_deposit "$2" "$3"
        ;;
    "simulate-withdraw")
        simulate_withdraw "$2" "$3"
        ;;
    "check-tx")
        check_transaction "$2"
        ;;
    "export")
        export_data "$2"
        ;;
    "all")
        get_vault_info
        get_balances
        ;;
    *)
        echo "DeFiVault Utility Scripts"
        echo ""
        echo "Usage: $0 <command> [args]"
        echo ""
        echo "Commands:"
        echo "  info                                - Show vault information"
        echo "  balances                            - Show all balances"
        echo "  user-balance <address>              - Show user balance"
        echo "  simulate-deposit <amount> <address> - Simulate deposit"
        echo "  simulate-withdraw <amount> <address>- Simulate withdrawal"
        echo "  check-tx <tx_hash>                  - Check transaction status"
        echo "  export [filename]                   - Export vault data to JSON"
        echo "  all                                 - Show all information"
        echo ""
        echo "Examples:"
        echo "  $0 info"
        echo "  $0 balances"
        echo "  $0 user-balance 0x1234..."
        echo "  $0 simulate-deposit 0.01 0x1234..."
        echo "  $0 simulate-withdraw 0.005 0x1234..."
        echo "  $0 check-tx 0xabcd..."
        echo "  $0 export vault_data.json"
        exit 1
        ;;
esac
