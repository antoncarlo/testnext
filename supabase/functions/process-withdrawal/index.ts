import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const LOCK_PERIOD_DAYS = 7; // Minimum days before withdrawal without penalty
const EARLY_WITHDRAWAL_PENALTY = 0.10; // 10% penalty for early withdrawal
const MIN_WITHDRAWAL_AMOUNT = 0.001; // Minimum withdrawal in ETH
const GAS_FEE_ESTIMATE = 0.0001; // Estimated gas fee in ETH

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { amount, destination_address, chain } = await req.json();

    // Validate input
    if (!amount || !destination_address || !chain) {
      throw new Error('Missing required fields');
    }

    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      throw new Error(`Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT} ETH`);
    }

    if (chain !== 'base' && chain !== 'solana') {
      throw new Error('Unsupported chain');
    }

    // Validate destination address format
    if (chain === 'base' && !destination_address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid Ethereum address');
    }

    // Calculate user's available balance from deposits
    const { data: deposits, error: depositsError } = await supabaseClient
      .from('deposits')
      .select('amount, created_at, status')
      .eq('user_id', user.id)
      .eq('chain', chain)
      .eq('status', 'confirmed');

    if (depositsError) {
      throw new Error('Failed to fetch deposits');
    }

    // Calculate total deposited amount
    const totalDeposited = deposits.reduce((sum, d) => sum + Number(d.amount), 0);

    // Calculate total withdrawn amount
    const { data: withdrawals, error: withdrawalsError } = await supabaseClient
      .from('withdrawals')
      .select('net_amount')
      .eq('user_id', user.id)
      .eq('chain', chain)
      .in('status', ['completed', 'processing']);

    if (withdrawalsError) {
      throw new Error('Failed to fetch withdrawals');
    }

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + Number(w.net_amount), 0);
    const availableBalance = totalDeposited - totalWithdrawn;

    console.log('Balance check:', {
      totalDeposited,
      totalWithdrawn,
      availableBalance,
      requestedAmount: amount,
    });

    if (availableBalance < amount) {
      throw new Error(`Insufficient balance. Available: ${availableBalance.toFixed(4)} ETH`);
    }

    // Check lock period and calculate penalty
    let penaltyAmount = 0;
    const now = new Date();
    const lockPeriodMs = LOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000;

    // Find deposits that are still within lock period
    const lockedDeposits = deposits.filter((d) => {
      const depositDate = new Date(d.created_at);
      const timeSinceDeposit = now.getTime() - depositDate.getTime();
      return timeSinceDeposit < lockPeriodMs;
    });

    if (lockedDeposits.length > 0) {
      // Calculate penalty on the requested amount
      penaltyAmount = amount * EARLY_WITHDRAWAL_PENALTY;
      console.log(`Early withdrawal detected. Penalty: ${penaltyAmount} ETH`);
    }

    // Calculate net amount after fees and penalties
    const gasFee = GAS_FEE_ESTIMATE;
    const netAmount = amount - penaltyAmount - gasFee;

    if (netAmount <= 0) {
      throw new Error('Net amount after fees and penalties is too low');
    }

    console.log('Withdrawal calculation:', {
      requestedAmount: amount,
      penaltyAmount,
      gasFee,
      netAmount,
    });

    // Create withdrawal record
    const { data: withdrawal, error: insertError } = await supabaseClient
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount,
        destination_address,
        chain,
        status: 'pending',
        gas_fee: gasFee,
        penalty_amount: penaltyAmount,
        net_amount: netAmount,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to create withdrawal record');
    }

    // In production, here you would:
    // 1. Queue the withdrawal for processing
    // 2. Use a secure backend service with Treasury private key
    // 3. Send the transaction on-chain
    // 4. Update the withdrawal record with tx_hash and status

    // For now, we'll mark it as pending and return success
    return new Response(
      JSON.stringify({
        success: true,
        withdrawal: {
          id: withdrawal.id,
          amount,
          net_amount: netAmount,
          penalty_amount: penaltyAmount,
          gas_fee: gasFee,
          status: 'pending',
          message:
            penaltyAmount > 0
              ? `Withdrawal requested with ${(EARLY_WITHDRAWAL_PENALTY * 100).toFixed(0)}% early withdrawal penalty. Your withdrawal will be processed within 24 hours.`
              : 'Withdrawal requested. Your withdrawal will be processed within 24 hours.',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
