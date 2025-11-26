/**
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 * 
 * Supabase Edge Function: Get Leaderboard
 * 
 * API REST per ottenere la classifica globale degli utenti
 * 
 * Endpoint: GET /get-leaderboard?page=1&limit=20
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { LeaderboardResponse } from '../_shared/types.ts';

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
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid parameters',
          message: 'page must be >= 1, limit must be between 1 and 100' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Inizializza Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Ottieni leaderboard
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .rpc('get_leaderboard', { 
        p_page: page,
        p_limit: limit 
      });

    if (leaderboardError) {
      throw new Error(`Failed to fetch leaderboard: ${leaderboardError.message}`);
    }

    // Ottieni count totale
    const { data: countData, error: countError } = await supabase
      .rpc('get_leaderboard_count');

    if (countError) {
      throw new Error(`Failed to fetch count: ${countError.message}`);
    }

    const totalUsers = countData || 0;

    // Formatta risposta
    const response: LeaderboardResponse = {
      page,
      limit,
      totalUsers,
      leaderboard: (leaderboardData || []).map((entry: any) => ({
        rank: entry.rank,
        walletAddress: entry.wallet_address,
        totalPoints: entry.total_points?.toString() || '0',
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
    console.error('Error in get-leaderboard:', error);
    
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
