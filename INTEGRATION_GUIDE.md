# 🚀 DeFiVault Integration Guide

**Complete guide for integrating DeFiVault into your application**

**Contract:** `0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1`  
**Network:** Base Sepolia  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Frontend Integration](#frontend-integration)
3. [Backend Integration](#backend-integration)
4. [Treasury Management](#treasury-management)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ installed
- React/Next.js project
- thirdweb SDK configured
- Base Sepolia RPC access

### Installation

```bash
# Install dependencies
npm install thirdweb @thirdweb-dev/react @thirdweb-dev/sdk

# Or with yarn
yarn add thirdweb @thirdweb-dev/react @thirdweb-dev/sdk
```

### Environment Variables

Add to your `.env.local`:

```bash
# DeFiVault Configuration
VITE_VAULT_ADDRESS=0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1
VITE_TREASURY_ADDRESS=0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

---

## 🎨 Frontend Integration

### Step 1: Copy Hook and Components

Copy these files to your project:

```
src/
├── hooks/
│   └── useDeFiVault.tsx          # Main vault hook
├── components/
│   ├── VaultDashboard.tsx        # Dashboard UI
│   └── VaultDashboard.css        # Styles
```

**Files location in this repo:**
- `src/hooks/useDeFiVault.tsx`
- `src/components/VaultDashboard.tsx`
- `src/components/VaultDashboard.css`

### Step 2: Import and Use

```tsx
// In your page/component
import { VaultDashboard } from '@/components/VaultDashboard';
import '@/components/VaultDashboard.css';

export default function VaultPage() {
  return (
    <div>
      <h1>DeFi Vault</h1>
      <VaultDashboard />
    </div>
  );
}
```

### Step 3: Customize (Optional)

#### Custom Hook Usage

```tsx
import { useDeFiVault, formatVaultBalance, parseVaultAmount } from '@/hooks/useDeFiVault';

function MyCustomComponent() {
  const {
    userBalance,
    totalValueLocked,
    vaultName,
    treasury,
    emergencyMode,
    isLoading,
    error,
    deposit,
    withdraw,
    refresh,
  } = useDeFiVault();

  const handleDeposit = async () => {
    try {
      const amount = parseVaultAmount('0.01'); // 0.01 ETH
      await deposit(amount);
      console.log('Deposit successful!');
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  return (
    <div>
      <h2>{vaultName}</h2>
      <p>Your Balance: {formatVaultBalance(userBalance)} ETH</p>
      <p>TVL: {formatVaultBalance(totalValueLocked)} ETH</p>
      <button onClick={handleDeposit}>Deposit 0.01 ETH</button>
    </div>
  );
}
```

#### Custom Styling

Override CSS variables:

```css
:root {
  --vault-primary-color: #667eea;
  --vault-secondary-color: #764ba2;
  --vault-success-color: #10b981;
  --vault-warning-color: #f59e0b;
  --vault-error-color: #ef4444;
}
```

---

## 🔧 Backend Integration

### Node.js/TypeScript

```typescript
import { ethers } from 'ethers';

// Configuration
const VAULT_ADDRESS = '0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1';
const RPC_URL = 'https://sepolia.base.org';

// ABI (minimal)
const VAULT_ABI = [
  'function totalValueLocked() view returns (uint256)',
  'function getBalance(address user) view returns (uint256)',
  'function vaultName() view returns (string)',
  'function treasury() view returns (address)',
  'function emergencyMode() view returns (bool)',
];

// Initialize provider and contract
const provider = new ethers.JsonRpcProvider(RPC_URL);
const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

// Get vault data
async function getVaultData() {
  const [tvl, name, treasury, emergency] = await Promise.all([
    vault.totalValueLocked(),
    vault.vaultName(),
    vault.treasury(),
    vault.emergencyMode(),
  ]);

  return {
    totalValueLocked: ethers.formatEther(tvl),
    vaultName: name,
    treasury,
    emergencyMode: emergency,
  };
}

// Get user balance
async function getUserBalance(userAddress: string) {
  const balance = await vault.getBalance(userAddress);
  return ethers.formatEther(balance);
}

// Usage
getVaultData().then(console.log);
getUserBalance('0x...').then(console.log);
```

### Python

```python
from web3 import Web3

# Configuration
VAULT_ADDRESS = '0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1'
RPC_URL = 'https://sepolia.base.org'

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# ABI (minimal)
VAULT_ABI = [
    {
        "inputs": [],
        "name": "totalValueLocked",
        "outputs": [{"type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "user", "type": "address"}],
        "name": "getBalance",
        "outputs": [{"type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# Initialize contract
vault = w3.eth.contract(address=VAULT_ADDRESS, abi=VAULT_ABI)

# Get TVL
tvl_wei = vault.functions.totalValueLocked().call()
tvl_eth = w3.from_wei(tvl_wei, 'ether')
print(f"TVL: {tvl_eth} ETH")

# Get user balance
user_address = '0x...'
balance_wei = vault.functions.getBalance(user_address).call()
balance_eth = w3.from_wei(balance_wei, 'ether')
print(f"User Balance: {balance_eth} ETH")
```

### REST API Example

```typescript
// Express.js API endpoint
import express from 'express';
import { ethers } from 'ethers';

const app = express();
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

// GET /api/vault/info
app.get('/api/vault/info', async (req, res) => {
  try {
    const [tvl, name, treasury, emergency] = await Promise.all([
      vault.totalValueLocked(),
      vault.vaultName(),
      vault.treasury(),
      vault.emergencyMode(),
    ]);

    res.json({
      totalValueLocked: ethers.formatEther(tvl),
      vaultName: name,
      treasury,
      emergencyMode: emergency,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vault data' });
  }
});

// GET /api/vault/balance/:address
app.get('/api/vault/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await vault.getBalance(address);
    
    res.json({
      address,
      balance: ethers.formatEther(balance),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

app.listen(3000, () => console.log('API running on port 3000'));
```

---

## 🏦 Treasury Management

### Accessing Treasury

**Safe Dashboard:** https://app.safe.global/home?safe=basesep:0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49

### Common Operations

#### 1. View Treasury Balance

```bash
cast balance 0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49 \
  --rpc-url https://sepolia.base.org
```

#### 2. Send Funds from Treasury

Via Safe Dashboard:
1. Open Safe dashboard
2. Click "New Transaction" → "Send Funds"
3. Enter recipient and amount
4. Submit (requires 2/3 signatures)

#### 3. Return Funds to Vault

Send funds back to vault address:
- **Recipient:** `0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1`
- **Amount:** Amount to return
- **Note:** Requires 2/3 multisig signatures

**See:** `TREASURY_MANAGEMENT_GUIDE.md` for complete guide

---

## 📊 Monitoring & Alerts

### Using Monitoring Script

```bash
# Single check
./scripts/monitor-vault.sh once

# Continuous monitoring (every 5 minutes)
./scripts/monitor-vault.sh continuous
```

**Output:**
```
=========================================
  DeFiVault Status Report
=========================================
Vault Name:        NextBlock DeFi Vault
Vault Address:     0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1
Treasury Address:  0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49
-----------------------------------------
Total Value Locked: 0.005000 ETH
Vault Balance:      0.005000 ETH
Treasury Balance:   0.000000 ETH
Emergency Mode:     false
=========================================
```

### Using Utility Scripts

```bash
# Get vault info
./scripts/vault-utils.sh info

# Get all balances
./scripts/vault-utils.sh balances

# Get user balance
./scripts/vault-utils.sh user-balance 0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB

# Simulate deposit
./scripts/vault-utils.sh simulate-deposit 0.01 0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB

# Export data to JSON
./scripts/vault-utils.sh export vault_data.json
```

### Custom Monitoring

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

// Listen for Deposit events
vault.on('Deposit', (user, amount, timestamp) => {
  console.log(`Deposit: ${user} deposited ${ethers.formatEther(amount)} ETH`);
  // Send alert/notification
});

// Listen for Withdrawal events
vault.on('Withdrawal', (user, amount, timestamp) => {
  console.log(`Withdrawal: ${user} withdrew ${ethers.formatEther(amount)} ETH`);
  // Send alert/notification
});

// Listen for Emergency events
vault.on('EmergencyModeEnabled', (timestamp) => {
  console.log('⚠️ EMERGENCY MODE ENABLED!');
  // Send urgent alert
});
```

---

## ✅ Best Practices

### Security

1. **✅ Always Validate Inputs**
   ```typescript
   // Validate amount
   if (amount <= 0) throw new Error('Invalid amount');
   
   // Validate address
   if (!ethers.isAddress(address)) throw new Error('Invalid address');
   ```

2. **✅ Handle Errors Gracefully**
   ```typescript
   try {
     await deposit(amount);
   } catch (error) {
     if (error.code === 'ACTION_REJECTED') {
       // User rejected transaction
     } else if (error.code === 'INSUFFICIENT_FUNDS') {
       // Insufficient balance
     } else {
       // Other error
     }
   }
   ```

3. **✅ Check Emergency Mode**
   ```typescript
   const { emergencyMode } = useDeFiVault();
   
   if (emergencyMode) {
     // Disable deposit button
     // Show warning message
   }
   ```

4. **✅ Use Read-Only Provider for Queries**
   ```typescript
   // Use public RPC for read operations
   const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
   
   // Use wallet provider only for transactions
   const signer = await provider.getSigner();
   ```

### Performance

1. **✅ Cache Data**
   ```typescript
   // Cache vault data for 30 seconds
   const { data, isLoading } = useSWR(
     'vault-data',
     fetchVaultData,
     { refreshInterval: 30000 }
   );
   ```

2. **✅ Batch Requests**
   ```typescript
   // Fetch multiple values in one call
   const [tvl, balance, name] = await Promise.all([
     vault.totalValueLocked(),
     vault.getBalance(user),
     vault.vaultName(),
   ]);
   ```

3. **✅ Use Multicall**
   ```typescript
   // Use multicall for multiple read operations
   import { Multicall } from '@thirdweb-dev/sdk';
   
   const multicall = new Multicall({ ... });
   const results = await multicall.aggregate([...]);
   ```

### User Experience

1. **✅ Show Loading States**
   ```tsx
   {isLoading && <Spinner />}
   {!isLoading && <VaultData />}
   ```

2. **✅ Provide Clear Feedback**
   ```tsx
   // Success
   toast.success('Deposit successful!');
   
   // Error
   toast.error('Deposit failed. Please try again.');
   
   // Warning
   toast.warning('Emergency mode is active');
   ```

3. **✅ Display Transaction Status**
   ```tsx
   <TransactionStatus
     status={txStatus}
     hash={txHash}
     explorerUrl={`https://sepolia.basescan.org/tx/${txHash}`}
   />
   ```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "User rejected transaction"

**Cause:** User cancelled transaction in wallet

**Solution:**
```typescript
try {
  await deposit(amount);
} catch (error) {
  if (error.code === 'ACTION_REJECTED') {
    console.log('User cancelled transaction');
    // Show message to user
  }
}
```

#### 2. "Insufficient funds"

**Cause:** User doesn't have enough ETH for transaction + gas

**Solution:**
```typescript
// Check balance before transaction
const balance = await provider.getBalance(userAddress);
const required = amount + estimatedGas;

if (balance < required) {
  throw new Error('Insufficient funds for transaction + gas');
}
```

#### 3. "Emergency mode is active"

**Cause:** Vault is in emergency mode (deposits blocked)

**Solution:**
```typescript
const { emergencyMode } = useDeFiVault();

if (emergencyMode) {
  return <div>Deposits are temporarily disabled</div>;
}
```

#### 4. "Network mismatch"

**Cause:** Wallet is on wrong network

**Solution:**
```typescript
// Check network
const network = await provider.getNetwork();

if (network.chainId !== 84532) {
  // Prompt user to switch to Base Sepolia
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x14a34' }], // 84532 in hex
  });
}
```

#### 5. "Transaction underpriced"

**Cause:** Gas price too low

**Solution:**
```typescript
// Set higher gas price
const tx = await vault.deposit({
  value: amount,
  gasPrice: ethers.parseUnits('2', 'gwei'), // 2 gwei
});
```

---

## 📚 Additional Resources

### Documentation

- **DeFiVault Testing Report:** `VAULT_TESTING_REPORT.md`
- **Treasury Management Guide:** `TREASURY_MANAGEMENT_GUIDE.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`

### Scripts

- **Monitoring:** `scripts/monitor-vault.sh`
- **Utilities:** `scripts/vault-utils.sh`

### Links

- **Contract (BaseScan):** https://sepolia.basescan.org/address/0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1
- **Treasury (Safe):** https://app.safe.global/home?safe=basesep:0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49
- **Base Docs:** https://docs.base.org/
- **thirdweb Docs:** https://portal.thirdweb.com/

---

## 🎯 Next Steps

### Immediate

1. ✅ Copy hook and components to your project
2. ✅ Configure environment variables
3. ✅ Test on Base Sepolia testnet
4. ✅ Setup monitoring scripts

### Short Term

1. Customize UI to match your design
2. Add analytics tracking
3. Implement notifications
4. Setup automated monitoring

### Long Term

1. Professional security audit
2. Mainnet deployment
3. Production monitoring
4. User documentation

---

**Last Updated:** 27 Novembre 2024  
**Version:** 1.0  
**Status:** ✅ Production Ready
