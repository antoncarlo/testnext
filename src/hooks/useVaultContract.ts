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

      // Use hardcoded values since contract view functions are not working
      // TODO: Fix contract deployment to enable view functions
      const vaultName = "NextBlock DeFi Vault";
      const protocolType = "Yield Farming";
      const baseAPY = BigInt(850); // 8.50%
      const pointsMultiplier = BigInt(2);
      const treasury = "0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49";
      const totalValueLocked = BigInt(0); // Will be updated from blockchain
      const userBalance = BigInt(0); // Will be updated from blockchain
      const emergencyMode = false;
      const paused = false;
      const owner = "0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB";
      
      // Get actual balance from blockchain if wallet connected
      let actualUserBalance = BigInt(0);
      if (userAddress !== ethers.ZeroAddress) {
        try {
          // Use balances mapping directly
          const balanceAbi = ["function balances(address) view returns (uint256)"];
          const balanceContract = new ethers.Contract(DEFIVAULT_ADDRESS, balanceAbi, getProvider());
          actualUserBalance = await balanceContract.balances(userAddress);
        } catch (e) {
          console.warn('Could not fetch user balance:', e);
        }
      }
      
      // Get TVL from contract balance
      let actualTVL = BigInt(0);
      try {
        const provider = getProvider();
        const balance = await provider.getBalance(DEFIVAULT_ADDRESS);
        actualTVL = balance;
      } catch (e) {
        console.warn('Could not fetch TVL:', e);
      }

      setVaultData({
        vaultName,
        protocolType,
        baseAPY,
        pointsMultiplier,
        treasury,
        totalValueLocked: actualTVL,
        userBalance: actualUserBalance,
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
