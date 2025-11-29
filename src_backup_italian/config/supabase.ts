/**
 * Supabase Configuration
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  
  // Database Tables
  tables: {
    users: 'users',
    userPoints: 'user_points',
    pointsHistory: 'points_history',
    deposits: 'deposits',
    withdrawals: 'withdrawals',
    referrals: 'referrals',
  },
  
  // Edge Functions
  functions: {
    getUserPoints: 'get-user-points',
    getLeaderboard: 'get-leaderboard',
    indexDeposit: 'index-deposit',
    indexWithdrawal: 'index-withdrawal',
    calculatePoints: 'calculate-points',
  },
};
