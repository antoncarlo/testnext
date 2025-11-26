/**
 * Points system tRPC router
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 */

import { publicProcedure, router } from './_core/trpc';
import { z } from 'zod';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

interface UserPoints {
  address: string;
  total_points: number;
  rank: number;
  last_updated: string;
}

interface PointsHistory {
  id: number;
  address: string;
  points: number;
  multiplier: number;
  activity_type: string;
  timestamp: string;
}

interface LeaderboardEntry {
  address: string;
  total_points: number;
  rank: number;
}

/**
 * Fetch user points from Supabase
 */
async function fetchUserPoints(address: string): Promise<UserPoints | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/get-user-points?address=${address}`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user points:', error);
    return null;
  }
}

/**
 * Fetch leaderboard from Supabase
 */
async function fetchLeaderboard(page: number, limit: number): Promise<{
  entries: LeaderboardEntry[];
  total: number;
}> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/get-leaderboard?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return { entries: [], total: 0 };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { entries: [], total: 0 };
  }
}

export const pointsRouter = router({
  /**
   * Get points for a specific user address
   */
  getUserPoints: publicProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .query(async ({ input }) => {
      const points = await fetchUserPoints(input.address);
      return points;
    }),

  /**
   * Get leaderboard with pagination
   */
  getLeaderboard: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const result = await fetchLeaderboard(input.page, input.limit);
      return result;
    }),
});
