/**
 * Points System Integration Hook
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 */

import { useState, useEffect } from 'react';
import { supabase, SUPABASE_CONFIG } from '@/config/supabase';
import { BLOCKCHAIN_CONFIG } from '@/config/blockchain';

export interface UserPoints {
  address: string;
  totalPoints: number;
  rank: number;
  lastUpdated: string;
  breakdown: {
    holding: number;
    liquidity: number;
    lending: number;
    referral: number;
  };
}

export interface LeaderboardEntry {
  address: string;
  totalPoints: number;
  rank: number;
}

export interface PointsHistory {
  id: number;
  address: string;
  points: number;
  multiplier: number;
  activityType: string;
  timestamp: string;
}

export const usePointsSystem = (userAddress?: string) => {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserPoints = async (address: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(SUPABASE_CONFIG.tables.userPoints)
        .select('*')
        .eq('address', address.toLowerCase())
        .single();

      if (error) throw error;

      if (data) {
        setUserPoints({
          address: data.address,
          totalPoints: data.total_points || 0,
          rank: data.rank || 0,
          lastUpdated: data.last_updated,
          breakdown: {
            holding: data.holding_points || 0,
            liquidity: data.liquidity_points || 0,
            lending: data.lending_points || 0,
            referral: data.referral_points || 0,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (limit: number = 20, offset: number = 0) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(SUPABASE_CONFIG.tables.userPoints)
        .select('address, total_points, rank')
        .order('total_points', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      if (data) {
        setLeaderboard(
          data.map((entry, index) => ({
            address: entry.address,
            totalPoints: entry.total_points || 0,
            rank: offset + index + 1,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPointsHistory = async (address: string, limit: number = 50) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(SUPABASE_CONFIG.tables.pointsHistory)
        .select('*')
        .eq('address', address.toLowerCase())
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (data) {
        setPointsHistory(
          data.map((entry) => ({
            id: entry.id,
            address: entry.address,
            points: entry.points || 0,
            multiplier: entry.multiplier || 1,
            activityType: entry.activity_type || 'unknown',
            timestamp: entry.timestamp,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching points history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePoints = (balance: number, activityType: keyof typeof BLOCKCHAIN_CONFIG.points.multipliers) => {
    const multiplier = BLOCKCHAIN_CONFIG.points.multipliers[activityType] || 1;
    return balance * multiplier;
  };

  useEffect(() => {
    if (userAddress) {
      fetchUserPoints(userAddress);
      fetchPointsHistory(userAddress);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchLeaderboard();
    
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, BLOCKCHAIN_CONFIG.points.updateInterval);

    return () => clearInterval(interval);
  }, []);

  return {
    userPoints,
    leaderboard,
    pointsHistory,
    loading,
    fetchUserPoints,
    fetchLeaderboard,
    fetchPointsHistory,
    calculatePoints,
  };
};
