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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { positionId } = await req.json();

    if (!positionId) {
      return new Response(
        JSON.stringify({ error: 'Position ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing withdrawal for position:', positionId, 'user:', user.id);

    // Verify position ownership
    const { data: position, error: positionError } = await supabase
      .from('user_defi_positions')
      .select('*')
      .eq('id', positionId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (positionError || !position) {
      console.error('Position error:', positionError);
      return new Response(
        JSON.stringify({ error: 'Position not found or already withdrawn' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate withdrawal amount with penalties using database function
    const { data: calculation, error: calcError } = await supabase
      .rpc('calculate_withdrawal_amount', { p_position_id: positionId })
      .single();

    if (calcError || !calculation) {
      console.error('Calculation error:', calcError);
      return new Response(
        JSON.stringify({ error: 'Failed to calculate withdrawal amount' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Withdrawal calculation:', calculation);

    // Update position status to withdrawn
    const { error: updateError } = await supabase
      .from('user_defi_positions')
      .update({
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
        current_value: (calculation as any).total_amount,
      })
      .eq('id', positionId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update position' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log activity
    await supabase.from('user_activity').insert({
      user_id: user.id,
      activity_type: 'vault_withdrawal',
      description: `Withdrew from vault: $${(calculation as any).total_amount.toFixed(2)}`,
      metadata: {
        position_id: positionId,
        principal: (calculation as any).principal,
        yield_earned: (calculation as any).yield_earned,
        penalty_amount: (calculation as any).penalty_amount,
        penalty_applied: (calculation as any).penalty_applied,
      },
    });

    console.log('Withdrawal completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        withdrawal: {
          totalAmount: (calculation as any).total_amount,
          principal: (calculation as any).principal,
          yieldEarned: (calculation as any).yield_earned,
          penaltyAmount: (calculation as any).penalty_amount,
          penaltyApplied: (calculation as any).penalty_applied,
          daysLocked: (calculation as any).days_locked,
          minDaysRequired: (calculation as any).min_days_required,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in vault-withdraw function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
