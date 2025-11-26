/**
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 * 
 * Shared types and interfaces for NextBlock Points System
 */

export interface UserPosition {
  walletAddress: string;
  holdingBalance: bigint;
  lpBalance: bigint;
  lendingBalance: bigint;
  referralVolume: bigint;
}

export interface PointsCalculation {
  walletAddress: string;
  totalPoints: number;
  breakdown: {
    holding: number;
    lp: number;
    lending: number;
    referral: number;
  };
}

export interface UserPointsResponse {
  walletAddress: string;
  totalPoints: string;
  rank: number | null;
  history: PointsHistoryEntry[];
}

export interface PointsHistoryEntry {
  date: string;
  pointsEarned: string;
  activity: string;
  multiplier: number;
}

export interface LeaderboardResponse {
  page: number;
  limit: number;
  totalUsers: number;
  leaderboard: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  totalPoints: string;
}

export interface ContractAddresses {
  nextBlockVault: string;
  usdcToken: string;
  lpPools: string[];
  lendingPlatforms: string[];
}

export const MULTIPLIERS = {
  HOLDING: 1.0,
  LP_DEX: 2.0,
  LENDING_COLLATERAL: 3.0,
  REFERRAL: 4.0,
} as const;

export const ACTIVITY_TYPES = {
  HOLDING: 'holding_nbkusdc',
  LP_DEX: 'lp_dex',
  LENDING: 'lending_collateral',
  REFERRAL: 'referral',
} as const;
