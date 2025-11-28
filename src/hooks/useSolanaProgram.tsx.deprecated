/**
 * Solana Program Integration Hook
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 */

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { BLOCKCHAIN_CONFIG } from '@/config/blockchain';

export interface SolanaDepositInfo {
  userUsdcBalance: number;
  depositHistory: DepositRecord[];
}

export interface DepositRecord {
  amount: number;
  timestamp: number;
  signature: string;
  status: 'pending' | 'completed' | 'failed';
}

export const useSolanaProgram = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [depositInfo, setDepositInfo] = useState<SolanaDepositInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const usdcMint = new PublicKey(BLOCKCHAIN_CONFIG.solana.programs.usdc);
  const programId = new PublicKey(BLOCKCHAIN_CONFIG.solana.programs.satellite);

  const fetchDepositInfo = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      const userUsdcAccount = await getAssociatedTokenAddress(
        usdcMint,
        publicKey
      );

      const balance = await connection.getTokenAccountBalance(userUsdcAccount);
      const userUsdcBalance = balance.value.uiAmount || 0;

      setDepositInfo({
        userUsdcBalance,
        depositHistory: [],
      });
    } catch (error) {
      console.error('Error fetching deposit info:', error);
      setDepositInfo({
        userUsdcBalance: 0,
        depositHistory: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchDepositInfo();
    }
  }, [publicKey]);

  const depositViaCCTP = async (amount: number, destinationAddress: string) => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    setLoading(true);
    try {
      const userUsdcAccount = await getAssociatedTokenAddress(
        usdcMint,
        publicKey
      );

      const transaction = new Transaction();

      const amountLamports = Math.floor(amount * 1_000_000);

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: programId,
          lamports: amountLamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      
      await connection.confirmTransaction(signature, 'confirmed');

      await fetchDepositInfo();

      return {
        signature,
        amount,
        destinationAddress,
      };
    } catch (error) {
      console.error('Error depositing via CCTP:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    depositInfo,
    loading,
    fetchDepositInfo,
    depositViaCCTP,
  };
};
