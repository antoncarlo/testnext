-- Add auto-compound and withdrawal fields to user_defi_positions
ALTER TABLE public.user_defi_positions
ADD COLUMN IF NOT EXISTS auto_compound BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_compound_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS compound_frequency TEXT DEFAULT 'daily' CHECK (compound_frequency IN ('daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS min_lock_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS early_withdrawal_penalty_percent NUMERIC DEFAULT 5.0;

-- Add index for auto-compound queries
CREATE INDEX IF NOT EXISTS idx_user_defi_positions_auto_compound 
ON public.user_defi_positions (auto_compound, last_compound_at) 
WHERE status = 'active' AND auto_compound = true;

-- Create function to calculate withdrawal amount with penalties
CREATE OR REPLACE FUNCTION public.calculate_withdrawal_amount(
  p_position_id UUID
)
RETURNS TABLE(
  total_amount NUMERIC,
  principal NUMERIC,
  yield_earned NUMERIC,
  penalty_amount NUMERIC,
  penalty_applied BOOLEAN,
  days_locked INTEGER,
  min_days_required INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position RECORD;
  v_days_held INTEGER;
  v_yield NUMERIC;
  v_penalty NUMERIC := 0;
  v_penalty_applied BOOLEAN := false;
BEGIN
  -- Get position details
  SELECT * INTO v_position
  FROM public.user_defi_positions
  WHERE id = p_position_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Position not found or already withdrawn';
  END IF;

  -- Calculate days held
  v_days_held := EXTRACT(EPOCH FROM (NOW() - v_position.created_at)) / 86400;

  -- Calculate yield
  v_yield := v_position.current_value - v_position.amount;

  -- Check if early withdrawal penalty applies
  IF v_days_held < v_position.min_lock_days THEN
    v_penalty_applied := true;
    v_penalty := v_position.current_value * (v_position.early_withdrawal_penalty_percent / 100);
  END IF;

  -- Return calculated values
  RETURN QUERY SELECT
    v_position.current_value - v_penalty as total_amount,
    v_position.amount as principal,
    v_yield as yield_earned,
    v_penalty as penalty_amount,
    v_penalty_applied as penalty_applied,
    v_days_held as days_locked,
    v_position.min_lock_days as min_days_required;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.calculate_withdrawal_amount IS 'Calculates withdrawal amount with penalties for early withdrawal';