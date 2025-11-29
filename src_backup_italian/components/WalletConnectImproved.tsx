/**
 * Improved Wallet Connect Component with Web3-Onboard
 * Multi-wallet support for Base blockchain
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useConnectWallet } from '@web3-onboard/react';
import { useAuth } from '@/hooks/useAuth';
import { Wallet, LogOut, CheckCircle2 } from 'lucide-react';
import { isTestnet, getBaseChainId } from '@/config/blockchain';

export const WalletConnectImproved = () => {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const { user, signOut } = useAuth();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    if (wallet) {
      // If user is authenticated via wallet (email contains @wallet.), sign them out too
      if (user?.email?.includes('@wallet.')) {
        await signOut();
      }
      await disconnect(wallet);
    }
  };

  const getWalletName = () => {
    if (!wallet) return '';
    return wallet.label;
  };

  const getAddress = () => {
    if (!wallet || !wallet.accounts || wallet.accounts.length === 0) return '';
    return wallet.accounts[0].address;
  };

  const getChainName = () => {
    if (!wallet || !wallet.chains || wallet.chains.length === 0) return '';
    const chainId = parseInt(wallet.chains[0].id, 16);
    if (chainId === 8453) return 'Base Mainnet';
    if (chainId === 84532) return 'Base Sepolia';
    return `Chain ${chainId}`;
  };

  if (wallet && wallet.accounts && wallet.accounts.length > 0) {
    const address = getAddress();
    return (
      <Card className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {getWalletName()} ({getChainName()})
            </p>
            <p className="font-mono font-medium">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Connect Your Wallet</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {isTestnet() 
          ? 'Connect to Base Sepolia testnet to start testing' 
          : 'Connect your wallet to start using NextBlock Re'}
      </p>
      <Button
        onClick={handleConnect}
        disabled={connecting}
        className="w-full h-auto py-4 flex items-center justify-center gap-3"
        size="lg"
      >
        <Wallet className="h-5 w-5" />
        <div className="flex flex-col items-start">
          <span className="font-semibold">
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </span>
          <span className="text-xs opacity-80">
            MetaMask, Coinbase, WalletConnect, Trust & more
          </span>
        </div>
      </Button>
      
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <p>Supported wallets: MetaMask, Coinbase Wallet, WalletConnect, Trust Wallet</p>
        {isTestnet() && (
          <p className="mt-2 text-yellow-600 dark:text-yellow-500">
            ⚠️ Testnet Mode: Connect to Base Sepolia (Chain ID: {getBaseChainId()})
          </p>
        )}
      </div>
    </Card>
  );
};
