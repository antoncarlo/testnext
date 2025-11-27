/**
 * Wallet Context Wrapper
 * Provides a simplified interface compatible with the Venetian UI
 * Uses Web3-Onboard directly
 */

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useConnectWallet } from "@web3-onboard/react";
import { ethers } from "ethers";

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  walletType: string | null;
  chainType: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [balance, setBalance] = useState(0);

  // Get balance when connected
  useEffect(() => {
    if (wallet?.provider && wallet.accounts[0]?.address) {
      const provider = new ethers.providers.Web3Provider(wallet.provider, 'any');
      provider.getBalance(wallet.accounts[0].address).then((bal) => {
        setBalance(parseFloat(ethers.utils.formatEther(bal)));
      }).catch((error) => {
        console.error("Failed to get balance:", error);
        setBalance(0);
      });
    } else {
      setBalance(0);
    }
  }, [wallet]);

  const connectWallet = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const disconnectWallet = () => {
    if (wallet) {
      disconnect(wallet);
    }
  };

  const walletType = wallet?.label || null;
  const chainId = wallet?.chains[0]?.id;
  const chainType = chainId === '0x14a34' ? 'base-sepolia' : chainId === '0x2105' ? 'base' : null;

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!wallet,
        address: wallet?.accounts[0]?.address || null,
        balance,
        connectWallet,
        disconnectWallet,
        walletType,
        chainType,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletVenetian() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletVenetian must be used within a WalletProvider");
  }
  return context;
}

// Export useWallet as alias for compatibility with existing code
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
