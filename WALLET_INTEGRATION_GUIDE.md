# Wallet Integration Guide - NextBlock Re

**Author**: Anton Carlo Santoro  
**Date**: November 26, 2025  
**Copyright**: © 2025 Anton Carlo Santoro. All rights reserved.

---

## Overview

This guide explains how to integrate the improved multi-wallet support using Web3-Onboard into the NextBlock Re application.

## Changes Made

### 1. New Dependencies Installed

```bash
npm install @web3-onboard/coinbase @web3-onboard/walletconnect @web3-onboard/trust
```

### 2. New Files Created

| File | Purpose |
|:-----|:--------|
| `src/config/web3-onboard.ts` | Web3-Onboard configuration with multi-wallet support |
| `src/hooks/useWalletImproved.tsx` | Improved wallet hook using Web3-Onboard |
| `src/components/WalletConnectImproved.tsx` | Improved wallet connect component |
| `src/AppImproved.tsx` | Updated App component with Web3OnboardProvider |

### 3. Supported Wallets

The new implementation supports:

- ✅ **MetaMask** - Most popular Ethereum wallet
- ✅ **Coinbase Wallet** - Coinbase's self-custody wallet
- ✅ **WalletConnect** - Connect any mobile wallet
- ✅ **Trust Wallet** - Multi-chain mobile wallet
- ✅ **Any injected wallet** - Browser extension wallets

### 4. Network Support

- **Base Mainnet** (Chain ID: 8453)
- **Base Sepolia** (Chain ID: 84532) - Testnet

Auto-detection based on `VITE_NETWORK` environment variable.

---

## Migration Steps

### Step 1: Update Environment Variables

Add to `.env.local`:

```env
# Network Mode (testnet or mainnet)
VITE_NETWORK=testnet

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# App URL
VITE_APP_URL=https://testnext-delta.vercel.app

# Base RPC URLs
VITE_BASE_RPC_URL=https://mainnet.base.org
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### Step 2: Replace App.tsx

Replace the current `src/App.tsx` with `src/AppImproved.tsx`:

```bash
mv src/App.tsx src/App.tsx.backup
mv src/AppImproved.tsx src/App.tsx
```

### Step 3: Update WalletConnect Component Usage

In any page that uses `<WalletConnect />`, you can optionally replace it with `<WalletConnectImproved />`:

```tsx
// Old
import { WalletConnect } from '@/components/WalletConnect';

// New
import { WalletConnectImproved } from '@/components/WalletConnectImproved';
```

### Step 4: Update Wallet Hook Usage

If you need to use the wallet in your components:

```tsx
// Old
import { useWallet } from '@/hooks/useWallet';

// New
import { useConnectWallet } from '@web3-onboard/react';

function MyComponent() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  
  // wallet.accounts[0].address - current address
  // wallet.chains[0].id - current chain ID
  // wallet.provider - ethers provider
}
```

### Step 5: Get WalletConnect Project ID

1. Go to https://cloud.walletconnect.com
2. Sign up / Log in
3. Create a new project
4. Copy the Project ID
5. Add it to `.env.local` as `VITE_WALLETCONNECT_PROJECT_ID`

---

## Testing

### Local Testing

```bash
# Set testnet mode
echo "VITE_NETWORK=testnet" >> .env.local

# Run dev server
npm run dev

# Open http://localhost:5173
# Click "Connect Wallet"
# Try different wallets (MetaMask, Coinbase, WalletConnect)
```

### Testnet Testing

1. Ensure you're connected to **Base Sepolia** (Chain ID: 84532)
2. Get testnet ETH from faucet
3. Test contract interactions with deployed contracts

### Production Testing

1. Set `VITE_NETWORK=mainnet` in Vercel environment variables
2. Deploy to Vercel
3. Test with real wallets on Base Mainnet

---

## Features

### Auto Network Switching

The wallet automatically switches to the correct network (Base Mainnet or Base Sepolia) based on the `VITE_NETWORK` environment variable.

### Multi-Wallet Support

Users can choose from multiple wallets:
- Browser extensions (MetaMask, Coinbase, Trust)
- Mobile wallets via WalletConnect
- Any injected wallet

### Better UX

- Clear wallet selection modal
- Network switching prompts
- Transaction notifications
- Account center for easy wallet management

### Error Handling

- Proper error messages for connection failures
- Automatic retry on network errors
- User-friendly error descriptions

---

## Troubleshooting

### Wallet Not Connecting

1. Check that the wallet extension is installed
2. Check that you're on the correct network
3. Try refreshing the page
4. Try disconnecting and reconnecting

### Wrong Network

1. The app will automatically prompt to switch networks
2. Approve the network switch in your wallet
3. If auto-switch fails, manually switch in your wallet

### WalletConnect Not Working

1. Ensure `VITE_WALLETCONNECT_PROJECT_ID` is set
2. Check that the Project ID is valid
3. Try a different mobile wallet

---

## API Reference

### useConnectWallet Hook

```tsx
const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();

// wallet.accounts[0].address - Current address
// wallet.chains[0].id - Current chain ID (hex)
// wallet.provider - Web3 provider
// wallet.label - Wallet name
// connecting - Boolean, true while connecting
// connect() - Function to open wallet modal
// disconnect(wallet) - Function to disconnect
```

### useSetChain Hook

```tsx
const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();

// chains - Available chains
// connectedChain - Current chain
// settingChain - Boolean, true while switching
// setChain({ chainId: '0x2105' }) - Switch to Base Mainnet
// setChain({ chainId: '0x14A34' }) - Switch to Base Sepolia
```

---

## Next Steps

1. **Deploy to Vercel** with updated environment variables
2. **Test all wallets** on testnet
3. **Get WalletConnect Project ID** for production
4. **Update documentation** for users
5. **Monitor wallet connections** in production

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/antoncarlo/testnext/issues
- Documentation: See `/docs` folder

---

**Copyright**: © 2025 Anton Carlo Santoro. All rights reserved.
