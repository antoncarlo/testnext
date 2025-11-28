import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';

// Configuration
const RPC_URL = 'https://sepolia.base.org';
const VAULT_ADDRESS = '0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1';
const SUPABASE_URL = 'https://ybxyciosasuawhswccxd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHljaW9zYXN1YXdoc3djY3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTk2MzIsImV4cCI6MjA3OTczNTYzMn0.v2lZM-ZDyOZGdG6YcuXhiijoX9eKhpuACtLWXqTRvgw';

const VAULT_ABI = [
  'event Deposit(address indexed user, uint256 amount, uint256 timestamp)',
  'event Withdraw(address indexed user, uint256 amount, uint256 timestamp)',
];

async function main() {
  console.log('🚀 Starting deposit backfill...\n');

  // Initialize provider and contract
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

  // Initialize Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Get current block number
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 50000); // Last 50k blocks
  
  console.log(`📡 Fetching deposit events from block ${fromBlock} to ${currentBlock}...`);
  const filter = contract.filters.Deposit();
  const events = await contract.queryFilter(filter, fromBlock, 'latest');

  console.log(`✅ Found ${events.length} deposit events\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const event of events) {
    const { user, amount, timestamp } = event.args as any;
    const txHash = event.transactionHash;
    const amountETH = parseFloat(ethers.formatEther(amount));
    const pointsAwarded = amountETH * 1000 * 2;

    console.log(`Processing deposit:`);
    console.log(`  User: ${user}`);
    console.log(`  Amount: ${amountETH} ETH`);
    console.log(`  Points: ${pointsAwarded}`);
    console.log(`  TX: ${txHash}`);

    try {
      // Call the backfill RPC function
      const { data, error } = await supabase.rpc('backfill_deposit', {
        p_wallet_address: user,
        p_amount: amountETH,
        p_tx_hash: txHash,
        p_timestamp: Number(timestamp),
      });

      if (error) {
        console.error(`  ✗ Error:`, error);
        errorCount++;
        continue;
      }

      if (data.success) {
        console.log(`  ✓ Success!`);
        console.log(`    User ID: ${data.user_id}`);
        console.log(`    Deposit ID: ${data.deposit_id}`);
        console.log(`    Points Awarded: ${data.points_awarded}`);
        successCount++;
      } else {
        console.log(`  ⊘ ${data.message}`);
        skipCount++;
      }
    } catch (err) {
      console.error(`  ✗ Exception:`, err);
      errorCount++;
    }

    console.log('');
  }

  console.log('✅ Backfill complete!');
  console.log(`   Success: ${successCount}`);
  console.log(`   Skipped: ${skipCount}`);
  console.log(`   Errors: ${errorCount}`);
}

main().catch(console.error);
