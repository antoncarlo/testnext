/**
 * Base Contracts Integration Hook
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BLOCKCHAIN_CONFIG, getBaseRpcUrl } from '@/config/blockchain';
import { useConnectWallet } from '@web3-onboard/react';

export interface VaultInfo {
  totalAssets: string;
  totalSupply: string;
  sharePrice: string;
  userBalance: string;
  userShares: string;
}

export const useBaseContracts = () => {
  const [{ wallet }] = useConnectWallet();
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wallet?.provider) {
      const ethersProvider = new ethers.BrowserProvider(wallet.provider);
      setProvider(ethersProvider);
      
      ethersProvider.getSigner().then(setSigner).catch(console.error);
    }
  }, [wallet]);

  const getVaultContract = () => {
    if (!provider) return null;
    
    const vaultAbi = [
      'function totalAssets() view returns (uint256)',
      'function totalSupply() view returns (uint256)',
      'function convertToAssets(uint256 shares) view returns (uint256)',
      'function balanceOf(address account) view returns (uint256)',
      'function deposit(uint256 assets, address receiver) returns (uint256)',
      'function withdraw(uint256 assets, address receiver, address owner) returns (uint256)',
      'function redeem(uint256 shares, address receiver, address owner) returns (uint256)',
    ];
    
    return new ethers.Contract(
      BLOCKCHAIN_CONFIG.base.contracts.vault,
      vaultAbi,
      signer || provider
    );
  };

  const getUSDCContract = () => {
    if (!provider) return null;
    
    const usdcAbi = [
      'function balanceOf(address account) view returns (uint256)',
      'function approve(address spender, uint256 amount) returns (bool)',
      'function allowance(address owner, address spender) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ];
    
    return new ethers.Contract(
      BLOCKCHAIN_CONFIG.base.contracts.usdc,
      usdcAbi,
      signer || provider
    );
  };

  const fetchVaultInfo = async (userAddress?: string) => {
    if (!provider) return;
    
    setLoading(true);
    try {
      const vault = getVaultContract();
      if (!vault) return;

      const [totalAssets, totalSupply] = await Promise.all([
        vault.totalAssets(),
        vault.totalSupply(),
      ]);

      let userBalance = '0';
      let userShares = '0';
      
      if (userAddress) {
        const usdc = getUSDCContract();
        if (usdc) {
          userBalance = await usdc.balanceOf(userAddress);
        }
        userShares = await vault.balanceOf(userAddress);
      }

      const sharePrice = totalSupply > 0n 
        ? (totalAssets * 10n**18n) / totalSupply 
        : 10n**18n;

      setVaultInfo({
        totalAssets: ethers.formatUnits(totalAssets, 6),
        totalSupply: ethers.formatUnits(totalSupply, 18),
        sharePrice: ethers.formatUnits(sharePrice, 18),
        userBalance: ethers.formatUnits(userBalance, 6),
        userShares: ethers.formatUnits(userShares, 18),
      });
    } catch (error) {
      console.error('Error fetching vault info:', error);
    } finally {
      setLoading(false);
    }
  };

  const deposit = async (amount: string) => {
    if (!signer) throw new Error('Wallet not connected');
    
    const vault = getVaultContract();
    const usdc = getUSDCContract();
    
    if (!vault || !usdc) throw new Error('Contracts not initialized');

    const amountWei = ethers.parseUnits(amount, 6);
    const userAddress = await signer.getAddress();

    const allowance = await usdc.allowance(userAddress, BLOCKCHAIN_CONFIG.base.contracts.vault);
    
    if (allowance < amountWei) {
      const approveTx = await usdc.approve(BLOCKCHAIN_CONFIG.base.contracts.vault, amountWei);
      await approveTx.wait();
    }

    const depositTx = await vault.deposit(amountWei, userAddress);
    const receipt = await depositTx.wait();
    
    return receipt;
  };

  const withdraw = async (amount: string) => {
    if (!signer) throw new Error('Wallet not connected');
    
    const vault = getVaultContract();
    if (!vault) throw new Error('Vault contract not initialized');

    const amountWei = ethers.parseUnits(amount, 6);
    const userAddress = await signer.getAddress();

    const withdrawTx = await vault.withdraw(amountWei, userAddress, userAddress);
    const receipt = await withdrawTx.wait();
    
    return receipt;
  };

  return {
    provider,
    signer,
    vaultInfo,
    loading,
    fetchVaultInfo,
    deposit,
    withdraw,
    getVaultContract,
    getUSDCContract,
  };
};
