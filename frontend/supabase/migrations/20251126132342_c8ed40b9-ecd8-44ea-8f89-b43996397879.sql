-- Add referral_code to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by TEXT REFERENCES public.profiles(referral_code) ON DELETE SET NULL;

-- Create referrals table to track referral relationships and rewards
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  referrer_points_earned NUMERIC DEFAULT 0,
  referee_points_earned NUMERIC DEFAULT 0,
  referee_first_deposit_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referrer_id, referee_id)
);

-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals as referrer"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they are referee"
ON public.referrals FOR SELECT
USING (auth.uid() = referee_id);

CREATE POLICY "System can insert referrals"
ON public.referrals FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update referrals"
ON public.referrals FOR UPDATE
USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON public.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- Function to handle referral signup
CREATE OR REPLACE FUNCTION public.handle_referral_signup(
  p_referee_id UUID,
  p_referral_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Find referrer by code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RAISE EXCEPTION 'Invalid referral code';
  END IF;

  IF v_referrer_id = p_referee_id THEN
    RAISE EXCEPTION 'Cannot refer yourself';
  END IF;

  -- Update referee's referred_by
  UPDATE public.profiles
  SET referred_by = p_referral_code
  WHERE id = p_referee_id;

  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referee_id, referral_code, status)
  VALUES (v_referrer_id, p_referee_id, p_referral_code, 'pending')
  ON CONFLICT (referrer_id, referee_id) DO NOTHING;

  -- Log activity
  INSERT INTO public.user_activity (user_id, activity_type, description, metadata)
  VALUES (
    p_referee_id,
    'referral_signup',
    'Signed up using referral code: ' || p_referral_code,
    jsonb_build_object('referral_code', p_referral_code, 'referrer_id', v_referrer_id)
  );
END;
$$;

-- Function to process referral bonus on first vault deposit
CREATE OR REPLACE FUNCTION public.process_referral_bonus(
  p_referee_id UUID,
  p_deposit_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_referrer_bonus NUMERIC;
  v_referee_bonus NUMERIC;
BEGIN
  -- Get pending referral
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referee_id = p_referee_id 
    AND status = 'pending'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN; -- No pending referral
  END IF;

  -- Calculate bonuses (10% of deposit for referrer, 5% for referee)
  v_referrer_bonus := p_deposit_amount * 0.10;
  v_referee_bonus := p_deposit_amount * 0.05;

  -- Update referral record
  UPDATE public.referrals
  SET 
    status = 'active',
    activated_at = NOW(),
    referrer_points_earned = v_referrer_bonus,
    referee_points_earned = v_referee_bonus,
    referee_first_deposit_amount = p_deposit_amount
  WHERE id = v_referral.id;

  -- Award points to referrer
  PERFORM update_user_points(
    v_referral.referrer_id,
    v_referrer_bonus,
    'referral_bonus',
    'Referral bonus from new user deposit',
    NULL
  );

  -- Award points to referee
  PERFORM update_user_points(
    p_referee_id,
    v_referee_bonus,
    'referral_bonus',
    'Signup bonus for using referral code',
    NULL
  );

  -- Log activities
  INSERT INTO public.user_activity (user_id, activity_type, description, metadata)
  VALUES (
    v_referral.referrer_id,
    'referral_bonus',
    'Earned referral bonus: ' || v_referrer_bonus || ' points',
    jsonb_build_object('referee_id', p_referee_id, 'bonus_points', v_referrer_bonus)
  );

  INSERT INTO public.user_activity (user_id, activity_type, description, metadata)
  VALUES (
    p_referee_id,
    'referral_bonus',
    'Earned signup bonus: ' || v_referee_bonus || ' points',
    jsonb_build_object('referrer_id', v_referral.referrer_id, 'bonus_points', v_referee_bonus)
  );
END;
$$;

-- Trigger to generate referral code for new users
CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION auto_generate_referral_code();

COMMENT ON FUNCTION public.process_referral_bonus IS 'Processes referral bonuses when referee makes first vault deposit';
COMMENT ON FUNCTION public.handle_referral_signup IS 'Handles referral code application during signup';