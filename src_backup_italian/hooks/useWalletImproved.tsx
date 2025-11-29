/**
 * Improved Wallet Hook with Web3-Onboard
 * Multi-wallet support for Base blockchain
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 */

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { isTestnet, getBaseChainId } from '@/config/blockchain';

export type WalletType = 'metamask' | 'phantom' | 'coinbase' | 'walletconnect' | 'trust' | null;
export type ChainType = 'base' | 'solana' | null;

interface WalletContextType {
  walletType: WalletType;
  chainType: ChainType;
  address: string | null;
  isConnected: boolean;
  provider: ethers.providers.Web3Provider | null;
  connectWallet: (type?: WalletType) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [chainType, setChainType] = useState<ChainType>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const { toast } = useToast();

  // Update state when wallet changes
  useEffect(() => {
    if (wallet?.provider) {
      const ethersProvider = new ethers.providers.Web3Provider(wallet.provider, 'any');
      setProvider(ethersProvider);
      
      const accounts = wallet.accounts;
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0].address);
        setChainType('base');
        
        // Detect wallet type from label
        const label = wallet.label.toLowerCase();
        if (label.includes('metamask')) {
          setWalletType('metamask');
        } else if (label.includes('coinbase')) {
          setWalletType('coinbase');
        } else if (label.includes('walletconnect')) {
          setWalletType('walletconnect');
        } else if (label.includes('trust')) {
          setWalletType('trust');
        } else {
          setWalletType('metamask'); // Default
        }
      }
    } else {
      setProvider(null);
      setAddress(null);
      setWalletType(null);
      setChainType(null);
    }
  }, [wallet]);

  // Auto-switch to correct network
  useEffect(() => {
    if (connectedChain && wallet) {
      const targetChainId = getBaseChainId();
      const currentChainId = parseInt(connectedChain.id, 16);
      
      if (currentChainId !== targetChainId) {
        const targetChainHex = `0x${targetChainId.toString(16)}`;
        setChain({ chainId: targetChainHex });
      }
    }
  }, [connectedChain, wallet, setChain]);

  const connectWallet = useCallback(async (type?: WalletType) => {
    try {
      const wallets = await connect();
      
      if (wallets && wallets.length > 0) {
        toast({
          title: 'Wallet Connected',
          description: `Connected successfully`,
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet. Please try again.',
        variant: 'destructive',
      });
    }
  }, [connect, toast]);

  const disconnectWallet = useCallback(async () => {
    if (wallet) {
      await disconnect(wallet);
      setAddress(null);
      setWalletType(null);
      setChainType(null);
      setProvider(null);
      
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      });
    }
  }, [wallet, disconnect, toast]);

  const switchNetwork = useCallback(async (chainId: number) => {
    try {
      const chainIdHex = `0x${chainId.toString(16)}`;
      await setChain({ chainId: chainIdHex });
      
      toast({
        title: 'Network Switched',
        description: `Switched to chain ID ${chainId}`,
      });
    } catch (error) {
      console.error('Error switching network:', error);
      toast({
        title: 'Network Switch Failed',
        description: 'Failed to switch network. Please try manually.',
        variant: 'destructive',
      });
    }
  }, [setChain, toast]);

  const isConnected = !!wallet && !!address;

  return (
    <WalletContext.Provider value={{ 
      walletType, 
      chainType, 
      address, 
      isConnected,
      provider,
      connectWallet, 
      disconnectWallet,
      switchNetwork,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletImproved = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletImproved must be used within a WalletProvider');
  }
  return context;
};
