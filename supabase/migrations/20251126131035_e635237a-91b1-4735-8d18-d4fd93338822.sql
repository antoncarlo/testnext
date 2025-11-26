-- Remove UNIQUE constraint on wallet_address to allow multiple 'pending' values
-- This allows users to sign up without connecting a wallet first
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_wallet_address_key;

-- Optionally, add a partial unique index that only enforces uniqueness 
-- for non-pending wallet addresses (wallets that are actually connected)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_wallet_address_unique_idx 
ON public.profiles (wallet_address) 
WHERE wallet_address != 'pending' AND wallet_address IS NOT NULL;