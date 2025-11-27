import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export type WalletType = 'metamask' | 'phantom' | null;
export type ChainType = 'base' | 'solana' | null;

interface WalletContextType {
  walletType: WalletType;
  chainType: ChainType;
  address: string | null;
  isConnected: boolean;
  connectWallet: (type: WalletType) => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [chainType, setChainType] = useState<ChainType>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const connectWallet = useCallback(async (type: WalletType) => {
    try {
      if (type === 'metamask') {
        // Check specifically for MetaMask
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          
          // Switch to Base network (chain ID: 8453)
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2105' }], // Base mainnet
            });
          } catch (switchError: any) {
            // Chain not added, add it
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x2105',
                  chainName: 'Base',
                  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org'],
                }],
              });
            }
          }

          setAddress(accounts[0]);
          setWalletType('metamask');
          setChainType('base');
          setIsConnected(true);
          localStorage.setItem('walletType', 'metamask');
          
          toast({
            title: 'Wallet Connected',
            description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          });
        } else {
          toast({
            title: 'MetaMask Not Found',
            description: 'Please install MetaMask extension',
            variant: 'destructive',
          });
        }
      } else if (type === 'phantom') {
        // Check specifically for Phantom
        if (window.solana && window.solana.isPhantom) {
          const response = await window.solana.connect();
          setAddress(response.publicKey.toString());
          setWalletType('phantom');
          setChainType('solana');
          setIsConnected(true);
          localStorage.setItem('walletType', 'phantom');
          
          toast({
            title: 'Wallet Connected',
            description: `Connected to ${response.publicKey.toString().slice(0, 6)}...${response.publicKey.toString().slice(-4)}`,
          });
        } else {
          toast({
            title: 'Phantom Not Found',
            description: 'Please install Phantom wallet',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    // Check if wallet was previously connected
    const savedWalletType = localStorage.getItem('walletType') as WalletType;
    if (savedWalletType) {
      connectWallet(savedWalletType);
    }
  }, [connectWallet]);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setWalletType(null);
    setChainType(null);
    setIsConnected(false);
    localStorage.removeItem('walletType');
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  }, [toast]);

  return (
    <WalletContext.Provider value={{ 
      walletType, 
      chainType, 
      address, 
      isConnected, 
      connectWallet, 
      disconnectWallet 
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
}
