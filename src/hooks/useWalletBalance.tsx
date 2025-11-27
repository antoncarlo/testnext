import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
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
        if (chainType === 'base') {
          // Fetch ETH balance on Base
          const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
          const balanceWei = await provider.getBalance(address);
          const balanceEth = ethers.formatEther(balanceWei);
          setBalance(parseFloat(balanceEth).toFixed(4));
        } else if (chainType === 'solana') {
          // Fetch SOL balance on Solana
          const connection = new Connection('https://api.mainnet-beta.solana.com');
          const publicKey = new PublicKey(address);
          const balanceLamports = await connection.getBalance(publicKey);
          const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
          setBalance(balanceSol.toFixed(4));
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

  return { balance, loading, symbol: chainType === 'base' ? 'ETH' : 'SOL' };
};
