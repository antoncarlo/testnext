-- ============================================
-- RLS (Row Level Security) Policies
-- Author: Anton Carlo Santoro
-- Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
-- Migration: Add RLS policies to all tables
-- ============================================

-- Enable RLS on all tables
ALTER TABLE defi_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_defi_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLE: defi_strategies (Vault)
-- ============================================
-- Everyone can read strategies/vault
-- Only admins can create/update/delete strategies

CREATE POLICY "Anyone can view strategies"
  ON defi_strategies FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert strategies"
  ON defi_strategies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update strategies"
  ON defi_strategies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete strategies"
  ON defi_strategies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TABLE: user_defi_positions
-- ============================================
-- Users can only access their own positions
-- Admins can view all positions

CREATE POLICY "Users can view own positions"
  ON user_defi_positions FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own positions"
  ON user_defi_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions"
  ON user_defi_positions FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own positions"
  ON user_defi_positions FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TABLE: points_history
-- ============================================
-- Users can only view their own points history
-- Admins can view all history

CREATE POLICY "Users can view own points history"
  ON points_history FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert points history"
  ON points_history FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TABLE: profiles
-- ============================================
-- Everyone can view profiles (for leaderboard, etc.)
-- Users can only update their own profile
-- Admins can update any profile

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TABLE: referrals
-- ============================================
-- Users can view referrals where they are referrer or referred
-- System can insert referrals
-- Admins can view all referrals

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (
    auth.uid() = referrer_id 
    OR auth.uid() = referred_id
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can update referrals"
  ON referrals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TABLE: user_activity
-- ============================================
-- Users can only view their own activity
-- System can insert activity logs
-- Admins can view all activity

CREATE POLICY "Users can view own activity"
  ON user_activity FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert activity"
  ON user_activity FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TABLE: user_roles
-- ============================================
-- Everyone can read roles (needed for policy checks)
-- Only admins can manage roles

CREATE POLICY "Anyone can view roles"
  ON user_roles FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update roles"
  ON user_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete roles"
  ON user_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TABLE: deposits (DEPRECATED - use user_defi_positions)
-- ============================================
-- Users can only view their own deposits
-- Admins can view all deposits

CREATE POLICY "Users can view own deposits"
  ON deposits FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own deposits"
  ON deposits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update deposits"
  ON deposits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "Anyone can view strategies" ON defi_strategies IS 
  'Tutti possono vedere le strategie DeFi disponibili';

COMMENT ON POLICY "Users can view own positions" ON user_defi_positions IS 
  'Gli utenti possono vedere solo le proprie posizioni DeFi';

COMMENT ON POLICY "Users can view own points history" ON points_history IS 
  'Gli utenti possono vedere solo la propria cronologia punti';

COMMENT ON POLICY "Anyone can view profiles" ON profiles IS 
  'Tutti possono vedere i profili (per leaderboard e referral)';

COMMENT ON POLICY "Users can view own referrals" ON referrals IS 
  'Gli utenti possono vedere solo i propri referral';

COMMENT ON POLICY "Users can view own activity" ON user_activity IS 
  'Gli utenti possono vedere solo la propria attività';

COMMENT ON POLICY "Anyone can view roles" ON user_roles IS 
  'Tutti possono vedere i ruoli (necessario per i check delle policy)';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select on all tables to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant insert/update/delete based on RLS policies
GRANT INSERT, UPDATE, DELETE ON defi_strategies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_defi_positions TO authenticated;
GRANT INSERT ON points_history TO authenticated;
GRANT INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT INSERT, UPDATE ON referrals TO authenticated;
GRANT INSERT ON user_activity TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_roles TO authenticated;
GRANT INSERT, UPDATE ON deposits TO authenticated;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index for user_id lookups (used in many policies)
CREATE INDEX IF NOT EXISTS idx_user_defi_positions_user_id ON user_defi_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);

-- Index for admin checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON user_roles(user_id, role);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- To verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- To view all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- To test as a user:
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims.sub TO 'user-uuid-here';
-- SELECT * FROM user_defi_positions; -- Should only see own positions
