#!/bin/bash

# ============================================
# Script to Apply RLS Policies to Supabase
# Author: Anton Carlo Santoro
# Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
# ============================================

set -e

echo "🔒 Applying RLS Policies to Supabase..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20251127000000_add_rls_policies.sql" ]; then
    echo "❌ Migration file not found!"
    echo "Make sure you're in the blockchain/backend-supabase directory"
    exit 1
fi

echo "📋 Migration file found: supabase/migrations/20251127000000_add_rls_policies.sql"
echo ""

# Check Supabase connection
echo "🔍 Checking Supabase connection..."
if ! supabase status &> /dev/null; then
    echo "⚠️  Not connected to Supabase. Linking project..."
    supabase link
fi

echo "✅ Connected to Supabase"
echo ""

# Show current RLS status
echo "📊 Current RLS Status:"
echo "----------------------"
supabase db execute --query "
SELECT 
    tablename, 
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
" || echo "⚠️  Could not fetch RLS status"

echo ""
echo "🚀 Applying RLS policies migration..."
echo "--------------------------------------"

# Apply migration
supabase db push

echo ""
echo "✅ Migration applied successfully!"
echo ""

# Verify RLS is enabled
echo "🔍 Verifying RLS Status After Migration:"
echo "-----------------------------------------"
supabase db execute --query "
SELECT 
    tablename, 
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
"

echo ""
echo "📋 RLS Policies Created:"
echo "------------------------"
supabase db execute --query "
SELECT 
    tablename, 
    policyname,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as operation
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
"

echo ""
echo "🎉 RLS Policies Applied Successfully!"
echo ""
echo "📚 Next Steps:"
echo "1. Test the policies with a test user"
echo "2. Verify that users can only access their own data"
echo "3. Verify that admins can access all data"
echo "4. Update Vercel environment variables if needed"
echo ""
