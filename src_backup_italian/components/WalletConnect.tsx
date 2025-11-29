/**
 * Improved Wallet Connect Component with Web3-Onboard
 * Multi-wallet support for Base blockchain - Venetian Style
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useConnectWallet } from '@web3-onboard/react';
import { useAuth } from '@/hooks/useAuth';
import { Wallet, LogOut, CheckCircle2, Anchor } from 'lucide-react';
import { isTestnet, getBaseChainId } from '@/config/blockchain';

export const WalletConnect = () => {
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
      <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="flex items-center gap-2 mb-4">
          <Anchor className="w-5 h-5 text-accent" />
          <h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
            Wallet Connesso
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {getWalletName()}
              </p>
              <p className="text-xs text-muted-foreground">
                {getChainName()}
              </p>
              <p className="font-mono font-semibold text-sm mt-1">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleDisconnect}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnetti
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-accent" />
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
          Connetti Wallet
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {isTestnet() 
          ? 'Connetti a Base Sepolia testnet per iniziare a testare' 
          : 'Connetti il tuo wallet per iniziare a usare NextBlock Re'}
      </p>
      <Button
        onClick={handleConnect}
        disabled={connecting}
        className="w-full h-auto py-4 flex items-center justify-center gap-3 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Wallet className="h-5 w-5" />
        <div className="flex flex-col items-start">
          <span className="font-semibold">
            {connecting ? 'Connessione...' : 'Connetti Wallet'}
          </span>
          <span className="text-xs opacity-80">
            MetaMask, Coinbase, WalletConnect, Trust & altro
          </span>
        </div>
      </Button>
    </Card>
  );
};
