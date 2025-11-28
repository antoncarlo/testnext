#!/bin/bash

# DeFiVault Monitoring Script
# Monitors vault status, balances, and alerts on anomalies

set -e

# Configuration
VAULT_ADDRESS="0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1"
TREASURY_ADDRESS="0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49"
RPC_URL="https://sepolia.base.org"
ALERT_THRESHOLD_ETH="0.1"  # Alert if TVL drops below this
CHECK_INTERVAL=300  # 5 minutes

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

wei_to_eth() {
    echo "scale=6; $1 / 1000000000000000000" | bc
}

check_vault_status() {
    log_info "Checking vault status..."

    # Get TVL
    TVL_WEI=$(cast call $VAULT_ADDRESS \
        "totalValueLocked()(uint256)" \
        --rpc-url $RPC_URL 2>/dev/null || echo "0")
    
    TVL_ETH=$(wei_to_eth $TVL_WEI)
    
    # Get vault balance
    VAULT_BALANCE_WEI=$(cast balance $VAULT_ADDRESS \
        --rpc-url $RPC_URL 2>/dev/null || echo "0")
    
    VAULT_BALANCE_ETH=$(wei_to_eth $VAULT_BALANCE_WEI)
    
    # Get treasury balance
    TREASURY_BALANCE_WEI=$(cast balance $TREASURY_ADDRESS \
        --rpc-url $RPC_URL 2>/dev/null || echo "0")
    
    TREASURY_BALANCE_ETH=$(wei_to_eth $TREASURY_BALANCE_WEI)
    
    # Get emergency mode status
    EMERGENCY_MODE=$(cast call $VAULT_ADDRESS \
        "emergencyMode()(bool)" \
        --rpc-url $RPC_URL 2>/dev/null || echo "false")
    
    # Get vault name
    VAULT_NAME=$(cast call $VAULT_ADDRESS \
        "vaultName()(string)" \
        --rpc-url $RPC_URL 2>/dev/null || echo "Unknown")
    
    # Display status
    echo ""
    echo "========================================="
    echo "  DeFiVault Status Report"
    echo "========================================="
    echo "Vault Name:        $VAULT_NAME"
    echo "Vault Address:     $VAULT_ADDRESS"
    echo "Treasury Address:  $TREASURY_ADDRESS"
    echo "-----------------------------------------"
    echo "Total Value Locked: $TVL_ETH ETH"
    echo "Vault Balance:      $VAULT_BALANCE_ETH ETH"
    echo "Treasury Balance:   $TREASURY_BALANCE_ETH ETH"
    echo "Emergency Mode:     $EMERGENCY_MODE"
    echo "========================================="
    echo ""
    
    # Check for anomalies
    if [ "$EMERGENCY_MODE" = "true" ]; then
        log_warn "⚠️  EMERGENCY MODE IS ACTIVE!"
        send_alert "Emergency mode is active on DeFiVault"
    fi
    
    # Check if TVL is below threshold
    if (( $(echo "$TVL_ETH < $ALERT_THRESHOLD_ETH" | bc -l) )); then
        log_warn "⚠️  TVL is below threshold ($TVL_ETH < $ALERT_THRESHOLD_ETH ETH)"
        send_alert "TVL is below threshold: $TVL_ETH ETH"
    fi
    
    # Check if vault balance doesn't match TVL
    BALANCE_DIFF=$(echo "$TVL_ETH - $VAULT_BALANCE_ETH" | bc)
    BALANCE_DIFF_ABS=$(echo "$BALANCE_DIFF" | tr -d '-')
    
    if (( $(echo "$BALANCE_DIFF_ABS > 0.0001" | bc -l) )); then
        log_warn "⚠️  Vault balance ($VAULT_BALANCE_ETH ETH) doesn't match TVL ($TVL_ETH ETH)"
        log_warn "    Difference: $BALANCE_DIFF ETH"
        log_warn "    This is normal if emergency withdrawal occurred"
    fi
    
    # Save to log file
    echo "$(date '+%Y-%m-%d %H:%M:%S'),$TVL_ETH,$VAULT_BALANCE_ETH,$TREASURY_BALANCE_ETH,$EMERGENCY_MODE" >> vault_monitor.log
    
    log_info "Status check complete"
}

send_alert() {
    local message="$1"
    log_error "ALERT: $message"
    
    # Add your alerting logic here:
    # - Send email
    # - Send Telegram message
    # - Send Slack notification
    # - Call webhook
    
    # Example: Write to alert log
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" >> vault_alerts.log
}

check_recent_events() {
    log_info "Checking recent events..."
    
    # Get latest block
    LATEST_BLOCK=$(cast block-number --rpc-url $RPC_URL)
    FROM_BLOCK=$((LATEST_BLOCK - 1000))  # Last ~1000 blocks (~30 minutes on Base)
    
    # Check for Deposit events
    DEPOSITS=$(cast logs \
        --address $VAULT_ADDRESS \
        --from-block $FROM_BLOCK \
        --to-block $LATEST_BLOCK \
        "Deposit(address indexed user, uint256 amount, uint256 timestamp)" \
        --rpc-url $RPC_URL 2>/dev/null | wc -l)
    
    # Check for Withdrawal events
    WITHDRAWALS=$(cast logs \
        --address $VAULT_ADDRESS \
        --from-block $FROM_BLOCK \
        --to-block $LATEST_BLOCK \
        "Withdrawal(address indexed user, uint256 amount, uint256 timestamp)" \
        --rpc-url $RPC_URL 2>/dev/null | wc -l)
    
    log_info "Recent activity (last ~30 min): $DEPOSITS deposits, $WITHDRAWALS withdrawals"
}

# Main monitoring loop
main() {
    log_info "Starting DeFiVault monitoring..."
    log_info "Vault: $VAULT_ADDRESS"
    log_info "Treasury: $TREASURY_ADDRESS"
    log_info "Check interval: ${CHECK_INTERVAL}s"
    
    # Create log files if they don't exist
    touch vault_monitor.log vault_alerts.log
    
    # Add header to log file if empty
    if [ ! -s vault_monitor.log ]; then
        echo "timestamp,tvl_eth,vault_balance_eth,treasury_balance_eth,emergency_mode" > vault_monitor.log
    fi
    
    while true; do
        check_vault_status
        check_recent_events
        
        log_info "Next check in ${CHECK_INTERVAL}s..."
        sleep $CHECK_INTERVAL
    done
}

# Handle script arguments
case "${1:-}" in
    "once")
        log_info "Running single check..."
        check_vault_status
        check_recent_events
        ;;
    "continuous")
        main
        ;;
    *)
        echo "Usage: $0 {once|continuous}"
        echo ""
        echo "  once       - Run a single status check"
        echo "  continuous - Run continuous monitoring (every ${CHECK_INTERVAL}s)"
        echo ""
        echo "Example:"
        echo "  $0 once           # Single check"
        echo "  $0 continuous     # Continuous monitoring"
        exit 1
        ;;
esac
