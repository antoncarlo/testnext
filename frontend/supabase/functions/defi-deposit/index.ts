import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepositRequest {
  strategyId: string;
  amount: number;
  txHash?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { strategyId, amount, txHash }: DepositRequest = await req.json();

    if (!strategyId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Strategy ID and positive amount required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing DeFi deposit for user ${user.id}, strategy ${strategyId}, amount ${amount}`);

    // Get strategy details
    const { data: strategy, error: strategyError } = await supabaseClient
      .from('defi_strategies')
      .select('*')
      .eq('id', strategyId)
      .eq('is_active', true)
      .single();

    if (strategyError || !strategy) {
      console.error('Strategy not found:', strategyError);
      return new Response(
        JSON.stringify({ error: 'Strategy not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In a real implementation, this would interact with the DeFi protocol
    // For now, we simulate the deposit by creating a position record
    const entryPrice = 1.0; // Simulated entry price
    const currentValue = amount * entryPrice;

    // Create position record
    const { data: position, error: positionError } = await supabaseClient
      .from('user_defi_positions')
      .insert({
        user_id: user.id,
        strategy_id: strategyId,
        amount: amount,
        entry_price: entryPrice,
        current_value: currentValue,
        status: 'active',
        tx_hash: txHash || `simulated_${Date.now()}`,
      })
      .select()
      .single();

    if (positionError) {
      console.error('Error creating position:', positionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create position', details: positionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log activity
    await supabaseClient.rpc('log_user_activity', {
      p_user_id: user.id,
      p_activity_type: 'defi_deposit',
      p_description: `Deposited ${amount} into ${strategy.name}`,
      p_metadata: {
        strategy_id: strategyId,
        strategy_name: strategy.name,
        amount: amount,
        position_id: position.id,
      },
    });

    // Process referral bonus if this is first vault deposit
    try {
      await supabaseClient.rpc('process_referral_bonus', {
        p_referee_id: user.id,
        p_deposit_amount: amount,
      });
      console.log('Referral bonus processed (if applicable)');
    } catch (refError) {
      console.log('No referral bonus to process or error:', refError);
      // Don't fail the whole deposit if referral processing fails
    }

    console.log(`DeFi deposit successful: position ${position.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        position: position,
        message: `Successfully deposited ${amount} into ${strategy.name}`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in defi-deposit function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
