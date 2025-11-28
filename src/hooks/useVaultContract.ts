/**
 * Hook for interacting with DeFiVault contract using wagmi
 * Uses existing wallet connection from web3-onboard
 */

import { useEffect, useState } from 'react';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { DEFIVAULT_ABI, DEFIVAULT_ADDRESS, BASE_SEPOLIA_CHAIN_ID } from '@/contracts/DeFiVault.abi';

export interface VaultData {
  vaultName: string;
  protocolType: string;
  baseAPY: bigint;
  pointsMultiplier: bigint;
  treasury: string;
  totalValueLocked: bigint;
  userBalance: bigint;
  emergencyMode: boolean;
  paused: boolean;
  owner: string;
}

export function useVaultContract() {
  const [{ wallet }] = useConnectWallet();
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get provider and signer
  const getProvider = () => {
    if (!wallet) return null;
    return new ethers.BrowserProvider(wallet.provider, 'any');
  };

  const getSigner = async () => {
    const provider = getProvider();
    if (!provider) return null;
    return await provider.getSigner();
  };

  const getContract = async (needsSigner = false) => {
    if (needsSigner) {
      const signer = await getSigner();
      if (!signer) throw new Error('Wallet not connected');
      return new ethers.Contract(DEFIVAULT_ADDRESS, DEFIVAULT_ABI, signer);
    } else {
      const provider = getProvider();
      if (!provider) throw new Error('Provider not available');
      return new ethers.Contract(DEFIVAULT_ADDRESS, DEFIVAULT_ABI, provider);
    }
  };

  // Fetch vault data
  const fetchVaultData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const contract = await getContract(false);
      const signer = await getSigner();
      const userAddress = signer ? await signer.getAddress() : ethers.ZeroAddress;

      const [
        vaultName,
        protocolType,
        baseAPY,
        pointsMultiplier,
        treasury,
        totalValueLocked,
        userBalance,
        emergencyMode,
        paused,
        owner,
      ] = await Promise.all([
        contract.vaultName(),
        contract.protocolType(),
        contract.baseAPY(),
        contract.pointsMultiplier(),
        contract.treasury(),
        contract.totalValueLocked(),
        userAddress !== ethers.ZeroAddress ? contract.getUserBalance(userAddress) : BigInt(0),
        contract.emergencyMode(),
        contract.paused(),
        contract.owner(),
      ]);

      setVaultData({
        vaultName,
        protocolType,
        baseAPY,
        pointsMultiplier,
        treasury,
        totalValueLocked,
        userBalance,
        emergencyMode,
        paused,
        owner,
      });
    } catch (err) {
      console.error('Error fetching vault data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Deposit ETH
  const deposit = async (amount: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const contract = await getContract(true);
      const value = ethers.parseEther(amount);

      const tx = await contract.deposit({ value });
      await tx.wait();

      // Refresh data after deposit
      await fetchVaultData();

      return tx.hash;
    } catch (err) {
      console.error('Error depositing:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw ETH
  const withdraw = async (amount: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const contract = await getContract(true);
      const value = ethers.parseEther(amount);

      const tx = await contract.withdraw(value);
      await tx.wait();

      // Refresh data after withdrawal
      await fetchVaultData();

      return tx.hash;
    } catch (err) {
      console.error('Error withdrawing:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on wallet change
  useEffect(() => {
    if (wallet) {
      fetchVaultData();
    }
  }, [wallet?.accounts[0]?.address]);

  return {
    vaultData,
    isLoading,
    error,
    deposit,
    withdraw,
    refresh: fetchVaultData,
    isConnected: !!wallet,
  };
}

// Utility functions
export function formatVaultBalance(balance: bigint): string {
  return ethers.formatEther(balance);
}

export function formatAPY(apy: bigint): string {
  return (Number(apy) / 100).toFixed(2);
}
