/**
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 * 
 * Supabase Edge Function: Calculate Points (Indexer)
 * 
 * Questa funzione viene eseguita periodicamente (es. ogni ora o ogni giorno)
 * tramite pg_cron per calcolare i punti di tutti gli utenti in base alle loro
 * posizioni on-chain.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'npm:ethers@6.9.0';
import {
  getOnChainPositions,
  calculatePoints,
} from '../_shared/blockchain.ts';
import { MULTIPLIERS, ACTIVITY_TYPES } from '../_shared/types.ts';
import type { ContractAddresses } from '../_shared/types.ts';

// Configurazione contratti Base
const CONTRACTS: ContractAddresses = {
  nextBlockVault: Deno.env.get('NEXTBLOCK_VAULT_ADDRESS') || '',
  usdcToken: Deno.env.get('USDC_BASE_ADDRESS') || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  lpPools: (Deno.env.get('LP_POOLS') || '').split(',').filter(Boolean),
  lendingPlatforms: (Deno.env.get('LENDING_PLATFORMS') || '').split(',').filter(Boolean),
};

serve(async (req) => {
  try {
    // Verifica autenticazione (opzionale - può essere chiamata solo da cron)
    const authHeader = req.headers.get('Authorization');
    const expectedToken = Deno.env.get('CRON_SECRET');
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting points calculation...');

    // Inizializza Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Inizializza provider RPC
    const rpcUrl = Deno.env.get('BASE_RPC_URL');
    if (!rpcUrl) {
      throw new Error('BASE_RPC_URL not configured');
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Ottieni tutti gli utenti dal database
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('wallet_address');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('No users found');
      return new Response(
        JSON.stringify({ 
          message: 'No users to process',
          processed: 0 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${users.length} users...`);

    let processed = 0;
    let errors = 0;

    // Processa ogni utente
    for (const user of users) {
      try {
        const walletAddress = user.wallet_address;

        // Ottieni posizioni on-chain
        const positions = await getOnChainPositions(
          walletAddress,
          provider,
          CONTRACTS
        );

        // Calcola punti per ogni attività
        const holdingPoints = calculatePoints(
          positions.holdingBalance,
          MULTIPLIERS.HOLDING,
          18 // nbkUSDC ha 18 decimali (ERC-4626)
        );

        const lpPoints = calculatePoints(
          positions.lpBalance,
          MULTIPLIERS.LP_DEX,
          18
        );

        const lendingPoints = calculatePoints(
          positions.lendingBalance,
          MULTIPLIERS.LENDING_COLLATERAL,
          18
        );

        const referralPoints = calculatePoints(
          positions.referralVolume,
          MULTIPLIERS.REFERRAL,
          6 // USDC ha 6 decimali
        );

        // Salva ogni attività separatamente per tracking dettagliato
        if (holdingPoints > 0) {
          await supabase.rpc('update_user_points', {
            p_user_address: walletAddress,
            p_points_earned: holdingPoints,
            p_source_activity: ACTIVITY_TYPES.HOLDING,
            p_multiplier: MULTIPLIERS.HOLDING,
            p_raw_balance: positions.holdingBalance.toString(),
          });
        }

        if (lpPoints > 0) {
          await supabase.rpc('update_user_points', {
            p_user_address: walletAddress,
            p_points_earned: lpPoints,
            p_source_activity: ACTIVITY_TYPES.LP_DEX,
            p_multiplier: MULTIPLIERS.LP_DEX,
            p_raw_balance: positions.lpBalance.toString(),
          });
        }

        if (lendingPoints > 0) {
          await supabase.rpc('update_user_points', {
            p_user_address: walletAddress,
            p_points_earned: lendingPoints,
            p_source_activity: ACTIVITY_TYPES.LENDING,
            p_multiplier: MULTIPLIERS.LENDING_COLLATERAL,
            p_raw_balance: positions.lendingBalance.toString(),
          });
        }

        if (referralPoints > 0) {
          await supabase.rpc('update_user_points', {
            p_user_address: walletAddress,
            p_points_earned: referralPoints,
            p_source_activity: ACTIVITY_TYPES.REFERRAL,
            p_multiplier: MULTIPLIERS.REFERRAL,
            p_raw_balance: positions.referralVolume.toString(),
          });
        }

        const totalPoints = holdingPoints + lpPoints + lendingPoints + referralPoints;
        
        console.log(`Processed ${walletAddress}: ${totalPoints.toFixed(2)} points`);
        processed++;

      } catch (error) {
        console.error(`Error processing user ${user.wallet_address}:`, error);
        errors++;
      }
    }

    console.log(`Points calculation complete. Processed: ${processed}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({
        message: 'Points calculation complete',
        processed,
        errors,
        totalUsers: users.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fatal error in calculate-points:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
