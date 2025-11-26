-- Create trigger to automatically log deposit confirmation
CREATE OR REPLACE FUNCTION public.log_deposit_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when deposit is confirmed
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    INSERT INTO public.user_activity (user_id, activity_type, description, metadata)
    VALUES (
      NEW.user_id,
      'deposit_confirmed',
      'Deposit confirmed on ' || NEW.chain,
      jsonb_build_object(
        'deposit_id', NEW.id,
        'amount', NEW.amount,
        'chain', NEW.chain,
        'tx_hash', NEW.tx_hash,
        'points_awarded', NEW.points_awarded
      )
    );
  END IF;

  -- Log when deposit fails
  IF NEW.status = 'failed' AND OLD.status = 'pending' THEN
    INSERT INTO public.user_activity (user_id, activity_type, description, metadata)
    VALUES (
      NEW.user_id,
      'deposit_failed',
      'Deposit failed on ' || NEW.chain,
      jsonb_build_object(
        'deposit_id', NEW.id,
        'amount', NEW.amount,
        'chain', NEW.chain,
        'tx_hash', NEW.tx_hash
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on deposits table
DROP TRIGGER IF EXISTS trigger_log_deposit_activity ON public.deposits;
CREATE TRIGGER trigger_log_deposit_activity
  AFTER UPDATE ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deposit_activity();