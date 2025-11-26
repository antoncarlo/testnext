import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowDownToLine, Loader2 } from 'lucide-react';

export const DepositCard = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { address, chainType, isConnected } = useWallet();
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

    setLoading(true);

    try {
      // Mock transaction hash for demo
      const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to continue',
          variant: 'destructive',
        });
        return;
      }

      // Insert deposit record
      const { error } = await supabase.from('deposits').insert({
        user_id: user.id,
        amount: depositAmount,
        tx_hash: txHash,
        chain: chainType || 'base',
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Deposit Initiated',
        description: `Depositing ${depositAmount} ETH. Points will be awarded once confirmed.`,
      });

      // Log deposit activity
      await logActivity('deposit_submitted', `Submitted deposit of ${depositAmount} ${chainType}`, {
        amount: depositAmount,
        chain: chainType,
        tx_hash: txHash,
      });

      setAmount('');
    } catch (error) {
      console.error('Deposit error:', error);
      toast({
        title: 'Deposit Failed',
        description: 'Failed to process deposit',
        variant: 'destructive',
      });
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

        <Button 
          onClick={handleDeposit} 
          disabled={!isConnected || loading || !amount}
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
