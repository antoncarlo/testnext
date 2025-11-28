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
  const [wrongNetwork, setWrongNetwork] = useState(false);

  // Check if wallet is on correct network
  const checkNetwork = async () => {
    if (!wallet) {
      setWrongNetwork(false);
      return true;
    }

    const chainId = wallet.chains[0]?.id;
    const isCorrectNetwork = chainId === '0x14a34' || chainId === '0x14A34'; // Base Sepolia
    setWrongNetwork(!isCorrectNetwork);
    return isCorrectNetwork;
  };

  // Switch to Base Sepolia network
  const switchToBaseSepolia = async () => {
    if (!wallet?.provider) return;

    try {
      await wallet.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14A34' }], // Base Sepolia
      });
      setWrongNetwork(false);
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await wallet.provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x14A34',
                chainName: 'Base Sepolia',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.base.org'],
                blockExplorerUrls: ['https://sepolia.basescan.org'],
              },
            ],
          });
          setWrongNetwork(false);
        } catch (addError) {
          console.error('Error adding Base Sepolia network:', addError);
          throw new Error('Failed to add Base Sepolia network');
        }
      } else {
        console.error('Error switching to Base Sepolia:', switchError);
        throw new Error('Failed to switch to Base Sepolia network');
      }
    }
  };

  // Get provider and signer
  const getProvider = () => {
    if (wallet) {
      return new ethers.BrowserProvider(wallet.provider, 'any');
    }
    // Fallback to public RPC when wallet is not connected
    return new ethers.JsonRpcProvider('https://sepolia.base.org');
  };

  const getSigner = async () => {
    try {
      const provider = getProvider();
      if (!provider) return null;
      if (!wallet) return null; // No wallet connected
      return await provider.getSigner();
    } catch (error) {
      // Handle "no such account" error when wallet not connected
      return null;
    }
  };

  const getContract = async (needsSigner = false) => {
    if (needsSigner) {
      const signer = await getSigner();
      if (!signer) throw new Error('Wallet not connected');
      return new ethers.Contract(DEFIVAULT_ADDRESS, DEFIVAULT_ABI, signer);
    } else {
      const provider = getProvider();
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
        userAddress !== ethers.ZeroAddress ? contract.getBalance(userAddress) : BigInt(0),
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

  // Auto-fetch on mount and wallet change
  useEffect(() => {
    const init = async () => {
      await checkNetwork();
      await fetchVaultData();
    };
    init();
  }, [wallet?.accounts[0]?.address, wallet?.chains[0]?.id]);

  return {
    vaultData,
    isLoading,
    error,
    deposit,
    withdraw,
    refresh: fetchVaultData,
    isConnected: !!wallet,
    wrongNetwork,
    switchToBaseSepolia,
  };
}

// Utility functions
export function formatVaultBalance(balance: bigint): string {
  return ethers.formatEther(balance);
}

export function formatAPY(apy: bigint): string {
  return (Number(apy) / 100).toFixed(2);
}
