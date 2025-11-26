-- Create table for DeFi strategies/protocols
CREATE TABLE IF NOT EXISTS public.defi_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  protocol_type TEXT NOT NULL, -- 'liquidity_provision', 'looping', 'yield_trading'
  assets TEXT[] NOT NULL,
  base_apy NUMERIC NOT NULL DEFAULT 0,
  points_multiplier NUMERIC NOT NULL DEFAULT 1,
  tvl NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_new BOOLEAN NOT NULL DEFAULT false,
  contract_address TEXT,
  chain TEXT NOT NULL DEFAULT 'solana',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user DeFi positions
CREATE TABLE IF NOT EXISTS public.user_defi_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  strategy_id UUID NOT NULL REFERENCES public.defi_strategies(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  points_earned NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'withdrawn', 'pending'
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.defi_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_defi_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for defi_strategies (public read, admin write)
CREATE POLICY "Anyone can view active strategies"
  ON public.defi_strategies
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage strategies"
  ON public.defi_strategies
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_defi_positions
CREATE POLICY "Users can view their own positions"
  ON public.user_defi_positions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own positions"
  ON public.user_defi_positions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions"
  ON public.user_defi_positions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all positions"
  ON public.user_defi_positions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all positions"
  ON public.user_defi_positions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update DeFi position value and points
CREATE OR REPLACE FUNCTION public.update_defi_position_value()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_strategy RECORD;
  v_time_held NUMERIC;
  v_points_to_award NUMERIC;
BEGIN
  -- Get strategy details
  SELECT * INTO v_strategy
  FROM public.defi_strategies
  WHERE id = NEW.strategy_id;

  -- Calculate time held in days
  v_time_held := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 86400;

  -- Calculate points based on amount, time, and multiplier
  v_points_to_award := (NEW.amount * v_time_held * v_strategy.points_multiplier) - OLD.points_earned;

  -- Update points if there are new points to award
  IF v_points_to_award > 0 THEN
    NEW.points_earned := NEW.points_earned + v_points_to_award;
    
    -- Award points to user
    PERFORM update_user_points(
      NEW.user_id,
      v_points_to_award,
      'defi_yield',
      'Points earned from ' || v_strategy.name,
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for updating position values
DROP TRIGGER IF EXISTS trigger_update_defi_position_value ON public.user_defi_positions;
CREATE TRIGGER trigger_update_defi_position_value
  BEFORE UPDATE ON public.user_defi_positions
  FOR EACH ROW
  WHEN (NEW.current_value IS DISTINCT FROM OLD.current_value)
  EXECUTE FUNCTION public.update_defi_position_value();

-- Create trigger for updated_at on strategies
DROP TRIGGER IF EXISTS update_defi_strategies_updated_at ON public.defi_strategies;
CREATE TRIGGER update_defi_strategies_updated_at
  BEFORE UPDATE ON public.defi_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on positions
DROP TRIGGER IF EXISTS update_user_defi_positions_updated_at ON public.user_defi_positions;
CREATE TRIGGER update_user_defi_positions_updated_at
  BEFORE UPDATE ON public.user_defi_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial DeFi strategies
INSERT INTO public.defi_strategies (name, protocol_type, assets, base_apy, points_multiplier, tvl, is_new, chain, metadata) VALUES
('Kamino', 'liquidity_provision', ARRAY['ONyc', 'USDC'], 0, 10, 230000, true, 'solana', '{"description": "Liquidity Provision", "risk_level": "low"}'),
('Loopscale', 'looping', ARRAY['ONyc', 'SOL'], 36.75, 3, 9230000, false, 'solana', '{"description": "Looping strategy", "risk_level": "medium"}'),
('RateX', 'yield_trading', ARRAY['ONyc'], 14.18, 5, 510000, true, 'solana', '{"description": "Yield Trading", "risk_level": "medium"}'),
('Exponent', 'yield_trading', ARRAY['ONyc'], 14.92, 5, 2500000, false, 'solana', '{"description": "Yield Trading", "risk_level": "medium"}');

-- Create function to get user's DeFi portfolio summary
CREATE OR REPLACE FUNCTION public.get_user_defi_summary(p_user_id UUID)
RETURNS TABLE (
  total_deposited NUMERIC,
  total_current_value NUMERIC,
  total_points_earned NUMERIC,
  active_positions_count BIGINT,
  total_yield NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount), 0) as total_deposited,
    COALESCE(SUM(current_value), 0) as total_current_value,
    COALESCE(SUM(points_earned), 0) as total_points_earned,
    COUNT(*) FILTER (WHERE status = 'active') as active_positions_count,
    COALESCE(SUM(current_value - amount), 0) as total_yield
  FROM public.user_defi_positions
  WHERE user_id = p_user_id;
END;
$$;