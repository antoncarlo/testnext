/**
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 * 
 * Blockchain utilities for querying on-chain positions
 */

import { ethers } from 'npm:ethers@6.9.0';
import type { UserPosition, ContractAddresses } from './types.ts';

// NextBlockVault ABI (minimal - solo balanceOf)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
];

// Uniswap V2 LP Token ABI (minimal)
const LP_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
];

/**
 * Ottiene le posizioni on-chain di un utente su Base
 */
export async function getOnChainPositions(
  walletAddress: string,
  provider: ethers.JsonRpcProvider,
  contracts: ContractAddresses
): Promise<UserPosition> {
  try {
    // 1. Holding Balance (nbkUSDC nel wallet)
    const vaultContract = new ethers.Contract(
      contracts.nextBlockVault,
      ERC20_ABI,
      provider
    );
    const holdingBalance = await vaultContract.balanceOf(walletAddress);

    // 2. LP Balance (somma di tutti i pool LP)
    let lpBalance = 0n;
    for (const lpPool of contracts.lpPools) {
      const lpContract = new ethers.Contract(lpPool, LP_TOKEN_ABI, provider);
      const balance = await lpContract.balanceOf(walletAddress);
      lpBalance += balance;
    }

    // 3. Lending Balance (placeholder - da implementare per piattaforme specifiche)
    // Questo richiede l'integrazione con le API delle piattaforme di lending
    const lendingBalance = 0n;

    // 4. Referral Volume (placeholder - da implementare con sistema referral)
    const referralVolume = 0n;

    return {
      walletAddress,
      holdingBalance,
      lpBalance,
      lendingBalance,
      referralVolume,
    };
  } catch (error) {
    console.error(`Error fetching positions for ${walletAddress}:`, error);
    
    // Ritorna posizioni vuote in caso di errore
    return {
      walletAddress,
      holdingBalance: 0n,
      lpBalance: 0n,
      lendingBalance: 0n,
      referralVolume: 0n,
    };
  }
}

/**
 * Converte balance da wei (18 decimali) a numero decimale
 */
export function formatBalance(balance: bigint, decimals: number = 18): number {
  return Number(ethers.formatUnits(balance, decimals));
}

/**
 * Calcola i punti da un balance applicando il moltiplicatore
 */
export function calculatePoints(balance: bigint, multiplier: number, decimals: number = 18): number {
  const formattedBalance = formatBalance(balance, decimals);
  return formattedBalance * multiplier;
}

/**
 * Ottiene tutti i token holders del vault
 * Questo richiede un indexed service come The Graph o Alchemy
 */
export async function getAllVaultHolders(
  vaultAddress: string,
  provider: ethers.JsonRpcProvider
): Promise<string[]> {
  // Implementazione semplificata
  // In produzione, usare The Graph o Alchemy per query efficienti
  
  // Per ora ritorniamo array vuoto
  // Questo dovrebbe essere popolato dal database man mano che gli utenti interagiscono
  return [];
}

/**
 * Verifica se un indirizzo è valido
 */
export function isValidAddress(address: string): boolean {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizza un indirizzo (checksum)
 */
export function normalizeAddress(address: string): string {
  try {
    return ethers.getAddress(address);
  } catch {
    throw new Error(`Invalid address: ${address}`);
  }
}
