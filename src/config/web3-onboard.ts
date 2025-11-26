/**
 * Web3-Onboard Configuration
 * Multi-wallet support for Base and Base Sepolia
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 */

import { init } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';
import coinbaseModule from '@web3-onboard/coinbase';
import walletConnectModule from '@web3-onboard/walletconnect';
import trustModule from '@web3-onboard/trust';

const injected = injectedModule();
const coinbase = coinbaseModule();
const trust = trustModule();

const walletConnect = walletConnectModule({
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  requiredChains: [8453, 84532], // Base Mainnet and Sepolia
  dappUrl: import.meta.env.VITE_APP_URL || 'https://testnext-delta.vercel.app',
});

const wallets = [
  injected,
  walletConnect,
  coinbase,
  trust,
];

export const chains = [
  {
    id: '0x2105', // 8453 in hex
    token: 'ETH',
    label: 'Base',
    rpcUrl: import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org',
    blockExplorerUrl: 'https://basescan.org',
  },
  {
    id: '0x14A34', // 84532 in hex
    token: 'ETH',
    label: 'Base Sepolia',
    rpcUrl: import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    blockExplorerUrl: 'https://sepolia.basescan.org',
  },
];

const appMetadata = {
  name: 'NextBlock Re',
  icon: '/logo.svg',
  description: 'Cross-chain DeFi platform on Base and Solana with CCTP integration',
  recommendedInjectedWallets: [
    { name: 'MetaMask', url: 'https://metamask.io' },
    { name: 'Coinbase Wallet', url: 'https://wallet.coinbase.com/' },
    { name: 'Trust Wallet', url: 'https://trustwallet.com/' },
  ],
  agreement: {
    version: '1.0.0',
    termsUrl: 'https://testnext-delta.vercel.app/terms',
    privacyUrl: 'https://testnext-delta.vercel.app/privacy',
  },
};

const web3Onboard = init({
  theme: 'dark',
  wallets,
  chains,
  appMetadata,
  accountCenter: {
    desktop: {
      enabled: true,
      position: 'bottomRight',
      hideTransactionProtectionBtn: true,
    },
    mobile: {
      enabled: true,
      position: 'bottomRight',
      hideTransactionProtectionBtn: true,
    },
  },
  connect: {
    autoConnectLastWallet: false, // Prevent infinite loops
    autoConnectAllPreviousWallet: false,
  },
  notify: {
    enabled: true,
    transactionHandler: (transaction) => {
      console.log('Transaction:', transaction);
      if (transaction.eventCode === 'txPool') {
        return {
          type: 'success',
          message: 'Your transaction has been submitted',
        };
      }
    },
    position: 'bottomRight',
  },
});

export { web3Onboard };
