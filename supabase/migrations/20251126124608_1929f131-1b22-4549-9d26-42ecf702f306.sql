-- Enable real-time for user_defi_positions table
ALTER TABLE public.user_defi_positions REPLICA IDENTITY FULL;

-- Add table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_defi_positions;