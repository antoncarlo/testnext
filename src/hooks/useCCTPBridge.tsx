/**
 * CCTP Bridge Hook for Base Chain
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 * 
 * Implements Circle's Cross-Chain Transfer Protocol (CCTP) for USDC transfers
 * between Base Chain and other supported chains.
 */

import { useState } from 'react';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { prepareContractCall, getContract } from 'thirdweb';
import { client } from '@/lib/thirdweb';
import { base, baseSepolia } from 'thirdweb/chains';
import { BLOCKCHAIN_CONFIG, isTestnet } from '@/config/blockchain';

export interface CCTPBridgeInfo {
  sourceChain: 'base' | 'ethereum' | 'arbitrum' | 'optimism';
  destinationChain: 'base' | 'ethereum' | 'arbitrum' | 'optimism';
  amount: number;
  status: 'idle' | 'burning' | 'attesting' | 'minting' | 'completed' | 'failed';
  txHash?: string;
  attestation?: string;
  error?: string;
}

export interface CCTPTransferParams {
  amount: number; // Amount in USDC (e.g., 100.50)
  destinationChain: 'ethereum' | 'arbitrum' | 'optimism';
  destinationAddress: string; // Recipient address on destination chain
}

// CCTP Domain IDs (from Circle documentation)
const CCTP_DOMAINS = {
  ethereum: 0,
  avalanche: 1,
  optimism: 2,
  arbitrum: 3,
  base: 6,
  polygon: 7,
} as const;

export const useCCTPBridge = () => {
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();
  const [bridgeInfo, setBridgeInfo] = useState<CCTPBridgeInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const chain = isTestnet() ? baseSepolia : base;
  const contracts = BLOCKCHAIN_CONFIG.base.contracts;
  const contractsTestnet = BLOCKCHAIN_CONFIG.base.contractsTestnet;
  const usdcAddress = isTestnet() ? contractsTestnet.usdc : contracts.usdc;
  const cctpReceiverAddress = isTestnet() 
    ? contractsTestnet.cctpReceiver 
    : contracts.cctpReceiver;

  /**
   * Transfer USDC via CCTP from Base to another chain
   */
  const transferViaCCTP = async (params: CCTPTransferParams): Promise<CCTPBridgeInfo> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    if (!cctpReceiverAddress || cctpReceiverAddress === '') {
      throw new Error('CCTP Receiver contract not deployed yet');
    }

    const { amount, destinationChain, destinationAddress } = params;

    // Validate destination address (0x + 40 hex chars)
    if (!/^0x[a-fA-F0-9]{40}$/.test(destinationAddress)) {
      throw new Error('Invalid destination address format');
    }

    // Convert amount to USDC decimals (6 decimals)
    const amountInUSDC = Math.floor(amount * 1_000_000);

    if (amountInUSDC <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    setLoading(true);
    setBridgeInfo({
      sourceChain: 'base',
      destinationChain,
      amount,
      status: 'burning',
    });

    try {
      // Step 1: Burn USDC on Base Chain via CCTP
      const usdcContract = getContract({
        client,
        chain,
        address: usdcAddress,
      });

      // Approve CCTP Receiver to spend USDC
      const approveTx = prepareContractCall({
        contract: usdcContract,
        method: 'function approve(address spender, uint256 amount) returns (bool)',
        params: [cctpReceiverAddress, BigInt(amountInUSDC)],
      });

      // Send approval transaction
      const approvalResult = await new Promise<string>((resolve, reject) => {
        sendTransaction(approveTx, {
          onSuccess: (result) => resolve(result.transactionHash),
          onError: (error) => reject(error),
        });
      });

      console.log('USDC approved for CCTP:', approvalResult);

      // Step 2: Call CCTP Receiver to initiate cross-chain transfer
      const cctpContract = getContract({
        client,
        chain,
        address: cctpReceiverAddress,
      });

      const destinationDomain = CCTP_DOMAINS[destinationChain];

      const transferTx = prepareContractCall({
        contract: cctpContract,
        method: 'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64)',
        params: [
          BigInt(amountInUSDC),
          destinationDomain,
          `0x${destinationAddress.slice(2).padStart(64, '0')}`, // Convert address to bytes32
          usdcAddress,
        ],
      });

      // Send transfer transaction
      const transferResult = await new Promise<string>((resolve, reject) => {
        sendTransaction(transferTx, {
          onSuccess: (result) => resolve(result.transactionHash),
          onError: (error) => reject(error),
        });
      });

      console.log('CCTP transfer initiated:', transferResult);

      // Step 3: Wait for attestation from Circle
      setBridgeInfo({
        sourceChain: 'base',
        destinationChain,
        amount,
        status: 'attesting',
        txHash: transferResult,
      });

      // Note: In production, you would poll Circle's attestation API here
      // For now, we mark as completed after burn transaction
      const finalInfo: CCTPBridgeInfo = {
        sourceChain: 'base',
        destinationChain,
        amount,
        status: 'completed',
        txHash: transferResult,
        attestation: 'Attestation would be fetched from Circle API in production',
      };

      setBridgeInfo(finalInfo);
      setLoading(false);

      return finalInfo;
    } catch (error) {
      console.error('Error transferring via CCTP:', error);
      
      const errorInfo: CCTPBridgeInfo = {
        sourceChain: 'base',
        destinationChain,
        amount,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      setBridgeInfo(errorInfo);
      setLoading(false);

      throw error;
    }
  };

  /**
   * Get CCTP transfer status by transaction hash
   */
  const getTransferStatus = async (txHash: string): Promise<CCTPBridgeInfo | null> => {
    // In production, this would query Circle's API for attestation status
    // For now, return null
    console.log('Checking CCTP status for tx:', txHash);
    return null;
  };

  /**
   * Estimate CCTP transfer time (in seconds)
   */
  const estimateTransferTime = (destinationChain: string): number => {
    // CCTP typically takes 10-20 minutes for attestation
    return 15 * 60; // 15 minutes in seconds
  };

  /**
   * Get CCTP fee estimate
   */
  const estimateFee = async (): Promise<number> => {
    // CCTP has no protocol fee, only gas fees
    // Return estimated gas cost in USD
    return 0.5; // Estimated $0.50 for gas
  };

  return {
    bridgeInfo,
    loading,
    transferViaCCTP,
    getTransferStatus,
    estimateTransferTime,
    estimateFee,
  };
};
