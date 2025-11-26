/**
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 * 
 * Supabase Edge Function: Get User Points
 * 
 * API REST per ottenere i punti totali, il rank e la cronologia di un utente
 * 
 * Endpoint: GET /get-user-points?wallet=0x...
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { isValidAddress, normalizeAddress } from '../_shared/blockchain.ts';
import type { UserPointsResponse } from '../_shared/types.ts';

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const walletParam = url.searchParams.get('wallet');

    if (!walletParam) {
      return new Response(
        JSON.stringify({ error: 'Missing wallet parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate and normalize address
    if (!isValidAddress(walletParam)) {
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const walletAddress = normalizeAddress(walletParam);

    // Inizializza Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Ottieni punti totali e rank
    const { data: pointsData, error: pointsError } = await supabase
      .rpc('get_user_points', { p_wallet_address: walletAddress });

    if (pointsError) {
      throw new Error(`Failed to fetch points: ${pointsError.message}`);
    }

    // Ottieni cronologia
    const { data: historyData, error: historyError } = await supabase
      .rpc('get_user_history', { 
        p_wallet_address: walletAddress,
        p_limit: 30 
      });

    if (historyError) {
      throw new Error(`Failed to fetch history: ${historyError.message}`);
    }

    // Se l'utente non esiste, ritorna dati vuoti
    if (!pointsData || pointsData.length === 0) {
      const response: UserPointsResponse = {
        walletAddress,
        totalPoints: '0',
        rank: null,
        history: [],
      };

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Formatta risposta
    const userPoints = pointsData[0];
    const response: UserPointsResponse = {
      walletAddress: userPoints.wallet_address,
      totalPoints: userPoints.total_points?.toString() || '0',
      rank: userPoints.rank,
      history: (historyData || []).map((entry: any) => ({
        date: entry.date,
        pointsEarned: entry.points_earned?.toString() || '0',
        activity: entry.activity,
        multiplier: entry.multiplier,
      })),
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-user-points:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
