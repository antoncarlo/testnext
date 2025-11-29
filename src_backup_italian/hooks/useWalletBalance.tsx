import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// Solana imports removed - Base Chain only
import { useWallet } from '@/contexts/WalletContext';

export const useWalletBalance = () => {
  const { address, chainType, isConnected } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || !chainType) {
      setBalance('0');
      return;
    }

    const fetchBalance = async () => {
      setLoading(true);
      try {
        if (chainType === 'base' || chainType === 'base-sepolia') {
          // Fetch ETH balance on Base or Base Sepolia
          const rpcUrl = chainType === 'base-sepolia' 
            ? 'https://sepolia.base.org'
            : 'https://mainnet.base.org';
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const balanceWei = await provider.getBalance(address);
          const balanceEth = ethers.formatEther(balanceWei);
          setBalance(parseFloat(balanceEth).toFixed(4));
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    
    return () => clearInterval(interval);
  }, [address, chainType, isConnected]);

  return { balance, loading, symbol: 'ETH' };
};
