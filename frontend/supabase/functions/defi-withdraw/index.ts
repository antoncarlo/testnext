import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WithdrawRequest {
  positionId: string;
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

    const { positionId, txHash }: WithdrawRequest = await req.json();

    if (!positionId) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Position ID required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing DeFi withdrawal for user ${user.id}, position ${positionId}`);

    // Get position details
    const { data: position, error: positionError } = await supabaseClient
      .from('user_defi_positions')
      .select('*, defi_strategies(*)')
      .eq('id', positionId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (positionError || !position) {
      console.error('Position not found:', positionError);
      return new Response(
        JSON.stringify({ error: 'Position not found or already withdrawn' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In a real implementation, this would interact with the DeFi protocol to withdraw
    // For now, we simulate the withdrawal by updating the position status

    // Calculate final yield
    const finalYield = position.current_value - position.amount;

    // Update position to withdrawn
    const { error: updateError } = await supabaseClient
      .from('user_defi_positions')
      .update({
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
        tx_hash: txHash || `simulated_withdraw_${Date.now()}`,
      })
      .eq('id', positionId);

    if (updateError) {
      console.error('Error updating position:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to withdraw position', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log activity
    await supabaseClient.rpc('log_user_activity', {
      p_user_id: user.id,
      p_activity_type: 'defi_withdraw',
      p_description: `Withdrawn ${position.amount} from ${position.defi_strategies.name}`,
      p_metadata: {
        position_id: positionId,
        strategy_name: position.defi_strategies.name,
        amount: position.amount,
        final_value: position.current_value,
        yield: finalYield,
        points_earned: position.points_earned,
      },
    });

    console.log(`DeFi withdrawal successful: position ${positionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully withdrawn from ${position.defi_strategies.name}`,
        amount: position.amount,
        finalValue: position.current_value,
        yield: finalYield,
        pointsEarned: position.points_earned,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in defi-withdraw function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
