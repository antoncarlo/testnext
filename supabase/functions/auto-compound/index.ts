import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting auto-compound process');

    // Get all positions eligible for compounding
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: positions, error: fetchError } = await supabase
      .from('user_defi_positions')
      .select(`
        *,
        defi_strategies (base_apy, points_multiplier)
      `)
      .eq('status', 'active')
      .eq('auto_compound', true);

    if (fetchError) {
      console.error('Error fetching positions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch positions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${positions?.length || 0} positions with auto-compound enabled`);

    let compoundedCount = 0;
    const results = [];

    for (const position of positions || []) {
      try {
        // Check if position is due for compounding based on frequency
        let shouldCompound = false;
        const lastCompound = new Date(position.last_compound_at);

        switch (position.compound_frequency) {
          case 'daily':
            shouldCompound = lastCompound < oneDayAgo;
            break;
          case 'weekly':
            shouldCompound = lastCompound < oneWeekAgo;
            break;
          case 'monthly':
            shouldCompound = lastCompound < oneMonthAgo;
            break;
        }

        if (!shouldCompound) {
          console.log(`Position ${position.id} not due for compounding yet`);
          continue;
        }

        // Calculate yield since last compound
        const timeSinceLastCompound = (now.getTime() - lastCompound.getTime()) / (1000 * 60 * 60 * 24); // days
        const dailyRate = position.defi_strategies.base_apy / 365 / 100;
        const yield_earned = position.current_value * dailyRate * timeSinceLastCompound;

        // Add yield to current value (compound)
        const newValue = position.current_value + yield_earned;

        // Calculate new points earned
        const pointsEarned = yield_earned * position.defi_strategies.points_multiplier;

        console.log(`Compounding position ${position.id}: ${yield_earned} yield, ${pointsEarned} points`);

        // Update position with compounded value
        const { error: updateError } = await supabase
          .from('user_defi_positions')
          .update({
            current_value: newValue,
            points_earned: position.points_earned + pointsEarned,
            last_compound_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', position.id);

        if (updateError) {
          console.error(`Error updating position ${position.id}:`, updateError);
          results.push({
            positionId: position.id,
            success: false,
            error: updateError.message,
          });
          continue;
        }

        // Award points to user
        await supabase.rpc('update_user_points', {
          p_user_id: position.user_id,
          p_points: pointsEarned,
          p_action_type: 'auto_compound',
          p_description: `Auto-compound yield from vault`,
        });

        // Log activity
        await supabase.from('user_activity').insert({
          user_id: position.user_id,
          activity_type: 'auto_compound',
          description: `Auto-compounded vault position: +$${yield_earned.toFixed(2)}`,
          metadata: {
            position_id: position.id,
            yield_earned,
            points_earned: pointsEarned,
            new_value: newValue,
          },
        });

        compoundedCount++;
        results.push({
          positionId: position.id,
          success: true,
          yieldEarned: yield_earned,
          pointsEarned,
          newValue,
        });

        console.log(`Successfully compounded position ${position.id}`);
      } catch (error) {
        console.error(`Error processing position ${position.id}:`, error);
        results.push({
          positionId: position.id,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    console.log(`Auto-compound complete. Processed ${compoundedCount} positions`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-compounded ${compoundedCount} positions`,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auto-compound function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
