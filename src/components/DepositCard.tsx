import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConnectWallet } from '@web3-onboard/react';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowDownToLine, Loader2, AlertCircle } from 'lucide-react';
import { BrowserProvider, parseEther, formatEther } from 'ethers';

// Treasury wallet address for deposits (replace with your actual address)
const TREASURY_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

export const DepositCard = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  
  // Get wallet info from Web3-Onboard
  const address = wallet?.accounts[0]?.address || null;
  const isConnected = !!wallet;
  const chainId = wallet?.chains[0]?.id;
  const chainType = chainId === '0x2105' ? 'base' : 'solana'; // 0x2105 = Base mainnet
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const { toast } = useToast();

  const handleDeposit = async () => {
    if (!isConnected || !address || !amount) {
      toast({
        title: 'Error',
        description: 'Please connect wallet and enter amount',
        variant: 'destructive',
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    // Only support Base chain for now
    if (chainType !== 'base') {
      toast({
        title: 'Unsupported Chain',
        description: 'Please switch to Base network in your wallet',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setTxStatus('Preparing transaction...');

    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to continue',
          variant: 'destructive',
        });
        return;
      }

      // Get the provider from window.ethereum
      if (!window.ethereum) {
        throw new Error('No Web3 provider found. Please install MetaMask or use Trust Wallet.');
      }

      setTxStatus('Connecting to wallet...');
      
      // Create ethers provider and signer
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Verify the connected address matches
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Wallet address mismatch. Please reconnect your wallet.');
      }

      setTxStatus('Sending transaction...');
      console.log('Sending transaction:', {
        from: address,
        to: TREASURY_ADDRESS,
        value: parseEther(amount.toString()),
      });

      // Send the transaction
      const tx = await signer.sendTransaction({
        to: TREASURY_ADDRESS,
        value: parseEther(amount.toString()),
      });

      console.log('Transaction sent:', tx.hash);
      setTxStatus('Waiting for confirmation...');

      toast({
        title: 'Transaction Sent',
        description: `Transaction hash: ${tx.hash.slice(0, 10)}...`,
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      console.log('Transaction confirmed:', receipt);
      setTxStatus('Saving to database...');

      // Insert deposit record with real transaction hash
      const { error: dbError } = await supabase.from('deposits').insert({
        user_id: currentUser.id,
        amount: depositAmount,
        tx_hash: tx.hash,
        chain: chainType,
        status: 'confirmed',
      });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save deposit record');
      }

      toast({
        title: 'Deposit Successful! 🎉',
        description: `Deposited ${depositAmount} ETH. You earned ${depositAmount * 1000} points!`,
      });

      // Log deposit activity
      await logActivity('deposit_confirmed', `Confirmed deposit of ${depositAmount} ETH`, {
        amount: depositAmount,
        chain: chainType,
        tx_hash: tx.hash,
        block_number: receipt.blockNumber,
      });

      setAmount('');
      setTxStatus('');
      
      // Reload the page to update stats
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Deposit error:', error);
      
      let errorMessage = 'Failed to process deposit';
      
      if (error.code === 4001 || error.message?.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Deposit Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      setTxStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <ArrowDownToLine className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Deposit</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="amount">Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!isConnected || loading}
            step="0.01"
            min="0"
          />
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Earn <span className="font-semibold text-foreground">1000 points</span> per ETH deposited
          </p>
        </div>

        {chainType !== 'base' && isConnected && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Please switch to Base network in your wallet to deposit
            </p>
          </div>
        )}

        {txStatus && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {txStatus}
            </p>
          </div>
        )}

        <Button 
          onClick={handleDeposit} 
          disabled={!isConnected || loading || !amount || chainType !== 'base'}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Processing...' : 'Deposit'}
        </Button>

        {!isConnected && (
          <p className="text-sm text-muted-foreground text-center">
            Connect your wallet to deposit
          </p>
        )}
      </div>
    </Card>
  );
};
