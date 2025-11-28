-- Migration: Fix NXB-H03 - Fix search_path in Supabase functions
-- Date: 2024-11-27
-- Description: Add SET search_path to functions to prevent search_path injection attacks

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Fix handle_new_user function (add SET search_path even if it has SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    RETURN NEW;
END;
$function$;

-- Add comments
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function to update updated_at column. Protected with SECURITY DEFINER and fixed search_path.';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create profile on user signup. Protected with SECURITY DEFINER and fixed search_path.';
