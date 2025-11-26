import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  tx_hash: string;
  chain: string;
  status: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting deposit processing...');

    // Fetch pending deposits
    const { data: pendingDeposits, error: fetchError } = await supabase
      .from('deposits')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('Error fetching deposits:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingDeposits?.length || 0} pending deposits`);

    if (!pendingDeposits || pendingDeposits.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending deposits to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each deposit
    for (const deposit of pendingDeposits as Deposit[]) {
      try {
        console.log(`Processing deposit ${deposit.id} on ${deposit.chain}`);

        let isConfirmed = false;

        if (deposit.chain === 'base') {
          isConfirmed = await verifyBaseTransaction(deposit.tx_hash);
        } else if (deposit.chain === 'solana') {
          isConfirmed = await verifySolanaTransaction(deposit.tx_hash);
        } else {
          console.error(`Unknown chain: ${deposit.chain}`);
          results.errors.push(`Deposit ${deposit.id}: Unknown chain ${deposit.chain}`);
          results.failed++;
          continue;
        }

        if (isConfirmed) {
          // Calculate points (1 point per 0.001 ETH/SOL)
          const points = Math.floor(deposit.amount * 1000);

          // Update deposit status
          const { error: updateError } = await supabase
            .from('deposits')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
              points_awarded: points,
            })
            .eq('id', deposit.id);

          if (updateError) {
            console.error(`Error updating deposit ${deposit.id}:`, updateError);
            results.errors.push(`Deposit ${deposit.id}: Update failed - ${updateError.message}`);
            results.failed++;
            continue;
          }

          // Award points to user
          const { error: pointsError } = await supabase.rpc('update_user_points', {
            p_user_id: deposit.user_id,
            p_points: points,
            p_action_type: 'deposit',
            p_description: `Deposit confirmed: ${deposit.amount} ${deposit.chain === 'base' ? 'ETH' : 'SOL'}`,
            p_deposit_id: deposit.id,
          });

          if (pointsError) {
            console.error(`Error awarding points for deposit ${deposit.id}:`, pointsError);
            results.errors.push(`Deposit ${deposit.id}: Points award failed - ${pointsError.message}`);
            results.failed++;
            continue;
          }

          console.log(`✓ Processed deposit ${deposit.id}: ${points} points awarded`);
          results.processed++;
        } else {
          console.log(`✗ Transaction ${deposit.tx_hash} not yet confirmed`);
        }
      } catch (error) {
        console.error(`Error processing deposit ${deposit.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.errors.push(`Deposit ${deposit.id}: ${errorMessage}`);
        results.failed++;
      }
    }

    console.log('Processing complete:', results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fatal error in process-deposits:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function verifyBaseTransaction(txHash: string): Promise<boolean> {
  try {
    // Use Base RPC endpoint
    const rpcUrl = 'https://mainnet.base.org';
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    });

    const data = await response.json();
    
    if (data.result && data.result.status === '0x1') {
      // Transaction successful (status 0x1 means success)
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error verifying Base transaction ${txHash}:`, error);
    return false;
  }
}

async function verifySolanaTransaction(txHash: string): Promise<boolean> {
  try {
    // Use Solana mainnet RPC endpoint
    const rpcUrl = 'https://api.mainnet-beta.solana.com';
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getTransaction',
        params: [
          txHash,
          { encoding: 'json', maxSupportedTransactionVersion: 0 },
        ],
        id: 1,
      }),
    });

    const data = await response.json();
    
    if (data.result && data.result.meta && data.result.meta.err === null) {
      // Transaction successful (no error)
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error verifying Solana transaction ${txHash}:`, error);
    return false;
  }
}
