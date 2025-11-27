import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'npm:ethers@6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base network RPC URL
const BASE_RPC_URL = 'https://mainnet.base.org';

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse request body
    const { withdrawal_id } = await req.json();

    if (!withdrawal_id) {
      throw new Error('Missing withdrawal_id');
    }

    console.log('Processing withdrawal:', withdrawal_id);

    // Fetch withdrawal record
    const { data: withdrawal, error: fetchError } = await supabaseClient
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawal_id)
      .single();

    if (fetchError || !withdrawal) {
      throw new Error('Withdrawal not found');
    }

    // Check if already processed
    if (withdrawal.status !== 'pending') {
      throw new Error(`Withdrawal already ${withdrawal.status}`);
    }

    console.log('Withdrawal details:', {
      id: withdrawal.id,
      amount: withdrawal.net_amount,
      destination: withdrawal.destination_address,
      chain: withdrawal.chain,
    });

    // Only support Base chain for now
    if (withdrawal.chain !== 'base') {
      throw new Error('Only Base chain is supported');
    }

    // Update status to processing
    await supabaseClient
      .from('withdrawals')
      .update({ status: 'processing' })
      .eq('id', withdrawal_id);

    // Get Treasury private key from environment
    const treasuryPrivateKey = Deno.env.get('TREASURY_PRIVATE_KEY');
    if (!treasuryPrivateKey) {
      throw new Error('Treasury private key not configured');
    }

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const wallet = new ethers.Wallet(treasuryPrivateKey, provider);

    console.log('Treasury wallet address:', wallet.address);
    console.log('Sending transaction...');

    // Send transaction
    const tx = await wallet.sendTransaction({
      to: withdrawal.destination_address,
      value: ethers.parseEther(withdrawal.net_amount.toString()),
    });

    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log('Transaction confirmed:', {
      hash: receipt?.hash,
      blockNumber: receipt?.blockNumber,
      status: receipt?.status,
    });

    if (receipt?.status !== 1) {
      throw new Error('Transaction failed on-chain');
    }

    // Update withdrawal record with success
    const { error: updateError } = await supabaseClient
      .from('withdrawals')
      .update({
        status: 'completed',
        tx_hash: receipt.hash,
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawal_id);

    if (updateError) {
      console.error('Failed to update withdrawal record:', updateError);
      throw new Error('Failed to update withdrawal record');
    }

    console.log('Withdrawal completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        tx_hash: receipt.hash,
        block_number: receipt.blockNumber,
        message: 'Withdrawal executed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Withdrawal execution error:', error);

    // Try to update withdrawal status to failed
    try {
      const { withdrawal_id } = await req.json();
      if (withdrawal_id) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );

        await supabaseClient
          .from('withdrawals')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error',
          })
          .eq('id', withdrawal_id);
      }
    } catch (updateError) {
      console.error('Failed to update withdrawal status:', updateError);
    }

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
