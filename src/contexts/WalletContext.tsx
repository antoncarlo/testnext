/**
 * Wallet Context Wrapper
 * Provides a simplified interface compatible with the Venetian UI
 * Uses the existing useWalletImproved hook under the hood
 */

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useWalletImproved } from "@/hooks/useWalletImproved";
import { useConnectWallet } from "@web3-onboard/react";
import { ethers } from "ethers";

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { isConnected, address, connectWallet: connectWalletImproved, disconnectWallet: disconnectWalletImproved, provider } = useWalletImproved();
  const [balance, setBalance] = useState(0);

  // Get balance when connected
  useEffect(() => {
    if (isConnected && address && provider) {
      provider.getBalance(address).then((bal) => {
        setBalance(parseFloat(ethers.utils.formatEther(bal)));
      }).catch((error) => {
        console.error("Failed to get balance:", error);
        setBalance(0);
      });
    } else {
      setBalance(0);
    }
  }, [isConnected, address, provider]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        balance,
        connectWallet: connectWalletImproved,
        disconnectWallet: disconnectWalletImproved,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
