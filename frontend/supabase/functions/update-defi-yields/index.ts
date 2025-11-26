import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting DeFi yields update job...');

    // Get all active positions
    const { data: positions, error: positionsError } = await supabaseClient
      .from('user_defi_positions')
      .select('*, defi_strategies(*)')
      .eq('status', 'active');

    if (positionsError) {
      console.error('Error fetching positions:', positionsError);
      throw positionsError;
    }

    if (!positions || positions.length === 0) {
      console.log('No active positions to update');
      return new Response(
        JSON.stringify({ message: 'No active positions to update' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Updating ${positions.length} active positions`);

    let updatedCount = 0;

    // Update each position's current value based on APY
    for (const position of positions) {
      try {
        const strategy = position.defi_strategies;
        
        // Calculate time held in days
        const timeHeld = (Date.now() - new Date(position.created_at).getTime()) / (1000 * 60 * 60 * 24);
        
        // Calculate new value based on APY (compounded daily)
        const dailyRate = strategy.base_apy / 100 / 365;
        const newValue = position.amount * Math.pow(1 + dailyRate, timeHeld);
        
        // Simulate some market volatility (±2%)
        const volatility = 1 + (Math.random() - 0.5) * 0.04;
        const currentValue = newValue * volatility;

        // Update position current value (this will trigger the points calculation)
        const { error: updateError } = await supabaseClient
          .from('user_defi_positions')
          .update({ current_value: currentValue })
          .eq('id', position.id);

        if (updateError) {
          console.error(`Error updating position ${position.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Updated position ${position.id}: ${position.amount} -> ${currentValue.toFixed(4)}`);
        }
      } catch (error) {
        console.error(`Error processing position ${position.id}:`, error);
      }
    }

    // Update strategy TVLs (aggregate all active positions)
    const { data: strategies, error: strategiesError } = await supabaseClient
      .from('defi_strategies')
      .select('id');

    if (!strategiesError && strategies) {
      for (const strategy of strategies) {
        const { data: strategyPositions } = await supabaseClient
          .from('user_defi_positions')
          .select('current_value')
          .eq('strategy_id', strategy.id)
          .eq('status', 'active');

        if (strategyPositions && strategyPositions.length > 0) {
          const tvl = strategyPositions.reduce((sum, pos) => sum + Number(pos.current_value), 0);
          
          await supabaseClient
            .from('defi_strategies')
            .update({ tvl: tvl })
            .eq('id', strategy.id);
        }
      }
    }

    console.log(`DeFi yields update completed. Updated ${updatedCount} positions.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updatedCount} positions`,
        totalPositions: positions.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-defi-yields function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
