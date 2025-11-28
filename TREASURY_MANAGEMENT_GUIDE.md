# 🏦 Treasury Management Guide

**DeFiVault Treasury Multisig Management**  
**Network:** Base Sepolia  
**Treasury Address:** `0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49`  
**Type:** Safe Multisig (2/3 signatures required)

---

## 📋 Table of Contents

1. [Treasury Overview](#treasury-overview)
2. [Accessing the Treasury](#accessing-the-treasury)
3. [Common Operations](#common-operations)
4. [Emergency Procedures](#emergency-procedures)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## 🔐 Treasury Overview

### Configuration

| Property | Value |
|----------|-------|
| **Address** | `0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49` |
| **Network** | Base Sepolia (Chain ID: 84532) |
| **Type** | Gnosis Safe Multisig |
| **Threshold** | 2 out of 3 signatures |
| **Purpose** | Emergency fund management for DeFiVault |

### Signers

| # | Address | Role |
|---|---------|------|
| 1 | `0xE499af7B8C1ba34E4F39B110797d8E64937496bd` | Signer 1 |
| 2 | `0xB1135f0fb79452F5D38F83E53b28D113E9D63781` | Signer 2 |
| 3 | `0x9d606550aD9ea012c0415c6C37814f5266622ee5` | Signer 3 |

**⚠️ IMPORTANT:** Keep private keys secure and backed up in multiple locations.

---

## 🌐 Accessing the Treasury

### Safe Dashboard

**URL:** https://app.safe.global/home?safe=basesep:0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49

### Steps to Access

1. **Navigate to Safe Dashboard**
   ```
   https://app.safe.global/
   ```

2. **Connect Wallet**
   - Click "Connect Wallet"
   - Select your wallet (MetaMask, WalletConnect, etc.)
   - Ensure you're on **Base Sepolia** network

3. **Select Safe**
   - If you're a signer, the Safe will appear in your list
   - Or paste the address: `0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49`

4. **Verify Network**
   - Ensure "Base Sepolia" is selected in the top right

---

## 🔧 Common Operations

### 1. View Treasury Balance

**Via Safe Dashboard:**
1. Open Safe dashboard
2. Balance is displayed on the home screen

**Via Command Line:**
```bash
cast balance 0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49 \
  --rpc-url https://sepolia.base.org
```

**Via Block Explorer:**
https://sepolia.basescan.org/address/0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49

---

### 2. Send Funds from Treasury

**Purpose:** Return emergency funds to vault or send to another address

**Steps:**

1. **Initiate Transaction (Signer 1)**
   - Open Safe dashboard
   - Click "New Transaction"
   - Select "Send Funds"
   - Enter:
     - **Recipient:** Vault address or destination
     - **Amount:** Amount in ETH
     - **Token:** ETH (or select token)
   - Click "Review"
   - Click "Submit"
   - Sign with your wallet

2. **Confirm Transaction (Signer 2)**
   - Open Safe dashboard
   - Go to "Transactions" → "Queue"
   - Find the pending transaction
   - Click "Confirm"
   - Sign with your wallet

3. **Execute Transaction**
   - After 2 signatures, click "Execute"
   - Transaction will be submitted to blockchain

**Command Line Alternative:**
```bash
# Using cast (requires 2/3 signers)
cast send 0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49 \
  --value 0.01ether \
  --to <RECIPIENT_ADDRESS> \
  --rpc-url https://sepolia.base.org
```

---

### 3. Return Funds to Vault

**Purpose:** Return emergency funds back to DeFiVault

**Recipient:** `0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1` (Vault)

**Method:** Use "Send Funds" operation above with vault as recipient

**Note:** Funds sent back to vault will increase TVL but won't be assigned to specific users. Consider using a dedicated "refund" function if implemented.

---

### 4. Update Treasury Address on Vault

**Purpose:** Change treasury address (e.g., upgrade to mainnet Safe)

**⚠️ CRITICAL:** Only vault owner can do this

**Steps:**

1. **Prepare New Treasury**
   - Deploy new Safe multisig
   - Verify signers and threshold

2. **Update on Vault Contract**
   ```bash
   cast send 0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1 \
     "updateTreasury(address)" \
     <NEW_TREASURY_ADDRESS> \
     --private-key <OWNER_PRIVATE_KEY> \
     --rpc-url https://sepolia.base.org
   ```

3. **Verify Update**
   ```bash
   cast call 0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1 \
     "treasury()(address)" \
     --rpc-url https://sepolia.base.org
   ```

4. **Transfer Funds**
   - Send funds from old treasury to new treasury
   - Requires 2/3 signatures on old Safe

---

## 🚨 Emergency Procedures

### Emergency Withdrawal Received

**Scenario:** Vault owner calls `emergencyWithdrawToTreasury()`

**What Happens:**
- All vault funds transferred to treasury
- Treasury balance increases
- Users' balances still tracked in vault

**Actions Required:**

1. **Verify Receipt**
   ```bash
   cast balance 0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49 \
     --rpc-url https://sepolia.base.org
   ```

2. **Check Transaction**
   - Go to BaseScan
   - Verify `EmergencyWithdrawal` event
   - Confirm amount received

3. **Assess Situation**
   - Determine reason for emergency withdrawal
   - Evaluate security of vault contract
   - Decide on next steps

4. **Communicate**
   - Notify all signers
   - Inform users (if applicable)
   - Document the incident

5. **Resolution Options**

   **Option A: Return Funds to Vault**
   ```bash
   # After issue is resolved
   # Send funds back to vault via Safe
   ```

   **Option B: Distribute to Users**
   ```bash
   # If vault is compromised
   # Distribute proportionally to users
   # Based on their tracked balances
   ```

   **Option C: Hold in Treasury**
   ```bash
   # If investigation ongoing
   # Keep funds safe in multisig
   # Wait for resolution
   ```

---

### Adding/Removing Signers

**Purpose:** Update multisig signers (e.g., team changes)

**Steps:**

1. **Open Safe Settings**
   - Go to Safe dashboard
   - Click "Settings" → "Owners"

2. **Add New Signer**
   - Click "Add new owner"
   - Enter new signer address
   - Enter owner name (optional)
   - Click "Review"
   - Requires 2/3 signatures to execute

3. **Remove Signer**
   - Click "Remove" next to signer
   - Confirm removal
   - Requires 2/3 signatures to execute

4. **Update Threshold (Optional)**
   - Click "Change threshold"
   - Select new threshold (e.g., 2/4, 3/5)
   - Requires 2/3 signatures to execute

---

### Changing Threshold

**Purpose:** Adjust number of required signatures

**Current:** 2 out of 3  
**Recommended:** Keep at least 2 signatures required

**Steps:**

1. Go to "Settings" → "Owners"
2. Click "Change threshold"
3. Select new threshold
4. Submit and get 2/3 signatures
5. Execute transaction

**⚠️ WARNING:** Never set threshold to 1/N for production funds.

---

## ✅ Best Practices

### Security

1. **✅ Use Hardware Wallets**
   - Store signer keys on hardware wallets (Ledger, Trezor)
   - Never expose private keys

2. **✅ Backup Keys**
   - Store backup phrases in secure locations
   - Use multiple physical locations
   - Consider using Shamir's Secret Sharing

3. **✅ Verify Transactions**
   - Always verify recipient address
   - Double-check amounts
   - Review transaction details before signing

4. **✅ Test First**
   - Test with small amounts first
   - Verify on testnet before mainnet
   - Confirm receipt before sending large amounts

5. **✅ Monitor Activity**
   - Set up notifications for Safe activity
   - Review transaction history regularly
   - Investigate unexpected transactions

### Operational

1. **✅ Document Everything**
   - Keep records of all transactions
   - Document reasons for emergency actions
   - Maintain communication logs

2. **✅ Regular Reviews**
   - Review signer list quarterly
   - Audit treasury balance monthly
   - Check for pending transactions weekly

3. **✅ Communication**
   - Establish communication channels (Telegram, Discord)
   - Notify all signers of important actions
   - Maintain emergency contact list

4. **✅ Succession Planning**
   - Have backup signers identified
   - Document procedures for signer replacement
   - Test signer rotation process

---

## 🔧 Troubleshooting

### Transaction Stuck

**Problem:** Transaction pending for too long

**Solutions:**

1. **Check Gas Price**
   - Transaction may need higher gas
   - Cancel and resubmit with higher gas

2. **Check Signatures**
   - Verify 2/3 signatures collected
   - Remind signers to sign

3. **Check Network**
   - Ensure Base Sepolia is not congested
   - Check BaseScan for network status

### Can't Access Safe

**Problem:** Can't see Safe in dashboard

**Solutions:**

1. **Verify Network**
   - Ensure Base Sepolia selected
   - Check RPC connection

2. **Verify Wallet**
   - Ensure correct wallet connected
   - Verify you're a signer

3. **Manual Load**
   - Go to "Add Safe"
   - Enter address manually
   - Select Base Sepolia network

### Wrong Balance Displayed

**Problem:** Balance doesn't match expected

**Solutions:**

1. **Refresh Dashboard**
   - Click refresh button
   - Wait for sync

2. **Check Block Explorer**
   - Verify on BaseScan
   - Compare with dashboard

3. **Clear Cache**
   - Clear browser cache
   - Reconnect wallet

---

## 📊 Monitoring & Alerts

### Manual Monitoring

**Daily:**
- Check treasury balance
- Review pending transactions

**Weekly:**
- Audit transaction history
- Verify signer status

**Monthly:**
- Full treasury audit
- Review security practices

### Automated Monitoring

**Set Up Alerts:**

1. **Safe Notifications**
   - Enable email notifications in Safe settings
   - Get alerts for new transactions

2. **Block Explorer Alerts**
   - Set up address watch on BaseScan
   - Get notifications for incoming/outgoing transactions

3. **Custom Monitoring**
   ```bash
   # Script to check balance and alert
   #!/bin/bash
   BALANCE=$(cast balance 0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49 --rpc-url https://sepolia.base.org)
   echo "Treasury Balance: $BALANCE wei"
   # Add alerting logic here
   ```

---

## 📞 Emergency Contacts

### Signers

| Signer | Contact Method | Backup Contact |
|--------|----------------|----------------|
| Signer 1 | email@example.com | Telegram: @signer1 |
| Signer 2 | email@example.com | Telegram: @signer2 |
| Signer 3 | email@example.com | Telegram: @signer3 |

### Support

- **Safe Support:** https://help.safe.global/
- **Base Network:** https://docs.base.org/
- **BaseScan:** https://sepolia.basescan.org/

---

## 🔗 Quick Links

### Treasury

- **Safe Dashboard:** https://app.safe.global/home?safe=basesep:0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49
- **BaseScan:** https://sepolia.basescan.org/address/0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49

### Vault Contract

- **Contract:** https://sepolia.basescan.org/address/0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1
- **Sourcify:** https://sourcify.dev/

### Documentation

- **Safe Docs:** https://docs.safe.global/
- **Base Docs:** https://docs.base.org/
- **Foundry Docs:** https://book.getfoundry.sh/

---

**Last Updated:** 27 Novembre 2024  
**Version:** 1.0  
**Status:** Active on Base Sepolia Testnet
