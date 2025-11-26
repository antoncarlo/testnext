-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_points DECIMAL(20, 2) DEFAULT 0,
  current_tier TEXT DEFAULT 'Bronze' CHECK (current_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'))
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Create deposits table
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chain TEXT NOT NULL CHECK (chain IN ('base', 'solana')),
  amount DECIMAL(20, 6) NOT NULL CHECK (amount > 0),
  tx_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  points_awarded DECIMAL(20, 2) DEFAULT 0,
  UNIQUE(tx_hash)
);

-- Enable RLS on deposits
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Deposits policies
CREATE POLICY "Users can view their own deposits"
  ON public.deposits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deposits"
  ON public.deposits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create points_history table
CREATE TABLE public.points_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points DECIMAL(20, 2) NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('deposit', 'referral', 'bonus', 'adjustment')),
  description TEXT,
  deposit_id UUID REFERENCES public.deposits(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on points_history
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

-- Points history policies
CREATE POLICY "Users can view their own points history"
  ON public.points_history FOR SELECT
  USING (auth.uid() = user_id);

-- Create leaderboard view (materialized for performance)
CREATE MATERIALIZED VIEW public.leaderboard AS
SELECT 
  p.id,
  p.wallet_address,
  p.total_points,
  p.current_tier,
  COUNT(DISTINCT d.id) as total_deposits,
  COALESCE(SUM(d.amount), 0) as total_deposited,
  ROW_NUMBER() OVER (ORDER BY p.total_points DESC, p.created_at ASC) as rank
FROM public.profiles p
LEFT JOIN public.deposits d ON d.user_id = p.id AND d.status = 'confirmed'
GROUP BY p.id, p.wallet_address, p.total_points, p.current_tier, p.created_at;

-- Create index on leaderboard
CREATE UNIQUE INDEX leaderboard_id_idx ON public.leaderboard(id);
CREATE INDEX leaderboard_rank_idx ON public.leaderboard(rank);

-- Function to refresh leaderboard
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard;
END;
$$;

-- Function to update user points
CREATE OR REPLACE FUNCTION update_user_points(
  p_user_id UUID,
  p_points DECIMAL(20, 2),
  p_action_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_deposit_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update total points in profiles
  UPDATE public.profiles
  SET 
    total_points = total_points + p_points,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Insert into points history
  INSERT INTO public.points_history (user_id, points, action_type, description, deposit_id)
  VALUES (p_user_id, p_points, p_action_type, p_description, p_deposit_id);
END;
$$;

-- Function to calculate tier based on points
CREATE OR REPLACE FUNCTION calculate_tier(p_points DECIMAL(20, 2))
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_points >= 100000 THEN
    RETURN 'Diamond';
  ELSIF p_points >= 50000 THEN
    RETURN 'Platinum';
  ELSIF p_points >= 10000 THEN
    RETURN 'Gold';
  ELSIF p_points >= 1000 THEN
    RETURN 'Silver';
  ELSE
    RETURN 'Bronze';
  END IF;
END;
$$;

-- Trigger to update tier when points change
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.current_tier := calculate_tier(NEW.total_points);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_user_tier
  BEFORE UPDATE OF total_points ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tier();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, wallet_address, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'wallet_address', 'pending'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX idx_deposits_status ON public.deposits(status);
CREATE INDEX idx_deposits_created_at ON public.deposits(created_at DESC);
CREATE INDEX idx_points_history_user_id ON public.points_history(user_id);
CREATE INDEX idx_points_history_created_at ON public.points_history(created_at DESC);
CREATE INDEX idx_profiles_total_points ON public.profiles(total_points DESC);
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);