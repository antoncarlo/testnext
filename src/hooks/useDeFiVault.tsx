import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { prepareContractCall, getContract, readContract } from 'thirdweb';
import { baseSepolia } from 'thirdweb/chains';
import { client } from '@/config/thirdweb';

// DeFiVault ABI (solo le funzioni necessarie)
const VAULT_ABI = [
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalValueLocked",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vaultName",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasury",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyMode",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "Deposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "Withdrawal",
    "type": "event"
  }
] as const;

const VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS as `0x${string}`;

interface VaultData {
  userBalance: bigint;
  totalValueLocked: bigint;
  vaultName: string;
  treasury: string;
  emergencyMode: boolean;
  isLoading: boolean;
  error: Error | null;
}

interface VaultActions {
  deposit: (amount: bigint) => Promise<void>;
  withdraw: (amount: bigint) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDeFiVault(): VaultData & VaultActions {
  const account = useActiveAccount();
  const { mutateAsync: sendTransaction } = useSendTransaction();

  const [vaultData, setVaultData] = useState<VaultData>({
    userBalance: 0n,
    totalValueLocked: 0n,
    vaultName: '',
    treasury: '',
    emergencyMode: false,
    isLoading: true,
    error: null,
  });

  const contract = getContract({
    client,
    chain: baseSepolia,
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
  });

  // Fetch vault data
  const fetchVaultData = useCallback(async () => {
    if (!account?.address) {
      setVaultData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setVaultData(prev => ({ ...prev, isLoading: true, error: null }));

      const [userBalance, tvl, name, treasury, emergency] = await Promise.all([
        readContract({
          contract,
          method: 'function getBalance(address) view returns (uint256)',
          params: [account.address],
        }),
        readContract({
          contract,
          method: 'function totalValueLocked() view returns (uint256)',
          params: [],
        }),
        readContract({
          contract,
          method: 'function vaultName() view returns (string)',
          params: [],
        }),
        readContract({
          contract,
          method: 'function treasury() view returns (address)',
          params: [],
        }),
        readContract({
          contract,
          method: 'function emergencyMode() view returns (bool)',
          params: [],
        }),
      ]);

      setVaultData({
        userBalance,
        totalValueLocked: tvl,
        vaultName: name,
        treasury,
        emergencyMode: emergency,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching vault data:', error);
      setVaultData(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [account?.address, contract]);

  // Deposit function
  const deposit = useCallback(async (amount: bigint) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const transaction = prepareContractCall({
        contract,
        method: 'function deposit() payable',
        params: [],
        value: amount,
      });

      await sendTransaction(transaction);
      
      // Refresh data after deposit
      await fetchVaultData();
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    }
  }, [account, contract, sendTransaction, fetchVaultData]);

  // Withdraw function
  const withdraw = useCallback(async (amount: bigint) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const transaction = prepareContractCall({
        contract,
        method: 'function withdraw(uint256)',
        params: [amount],
      });

      await sendTransaction(transaction);
      
      // Refresh data after withdrawal
      await fetchVaultData();
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw error;
    }
  }, [account, contract, sendTransaction, fetchVaultData]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchVaultData();
  }, [fetchVaultData]);

  // Auto-fetch on mount and account change
  useEffect(() => {
    fetchVaultData();
  }, [fetchVaultData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVaultData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchVaultData]);

  return {
    ...vaultData,
    deposit,
    withdraw,
    refresh,
  };
}

// Utility functions
export function formatVaultBalance(balance: bigint): string {
  return (Number(balance) / 1e18).toFixed(4);
}

export function parseVaultAmount(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1e18));
}
