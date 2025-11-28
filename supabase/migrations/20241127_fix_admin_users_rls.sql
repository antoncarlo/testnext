-- Migration: Fix NXB-C01 - Enable RLS on admin_users table
-- Date: 2024-11-27
-- Description: Enable Row Level Security on admin_users table with proper policies

-- Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin users are viewable by authenticated users" ON public.admin_users;
DROP POLICY IF EXISTS "Only service role can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only service role can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only service role can delete admin users" ON public.admin_users;

-- Policy 1: Authenticated users can view admin_users (to check if they are admin)
CREATE POLICY "Admin users are viewable by authenticated users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Only service role can insert admin users
CREATE POLICY "Only service role can insert admin users"
ON public.admin_users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy 3: Only service role can update admin users
CREATE POLICY "Only service role can update admin users"
ON public.admin_users
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 4: Only service role can delete admin users
CREATE POLICY "Only service role can delete admin users"
ON public.admin_users
FOR DELETE
TO service_role
USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;

-- Add comment
COMMENT ON TABLE public.admin_users IS 'Admin users table with RLS enabled. Only service role can modify, authenticated users can read to check admin status.';
