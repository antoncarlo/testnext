import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, TrendingUp, DollarSign, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VaultWithdrawProps {
  positionId: string;
  positionName: string;
  onWithdrawComplete: () => void;
}

interface WithdrawalPreview {
  total_amount: number;
  principal: number;
  yield_earned: number;
  penalty_amount: number;
  penalty_applied: boolean;
  days_locked: number;
  min_days_required: number;
}

export const VaultWithdraw = ({ positionId, positionName, onWithdrawComplete }: VaultWithdrawProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<WithdrawalPreview | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('calculate_withdrawal_amount', { p_position_id: positionId })
        .single();

      if (error) throw error;

      setPreview(data);
      setShowDialog(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to calculate withdrawal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(
        'https://mxkdrdjbvhhwhstbocux.supabase.co/functions/v1/vault-withdraw',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ positionId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Withdrawal failed');
      }

      toast({
        title: 'Withdrawal Successful',
        description: `Successfully withdrew $${result.withdrawal.totalAmount.toFixed(2)}`,
      });

      setShowDialog(false);
      onWithdrawComplete();
    } catch (error: any) {
      toast({
        title: 'Withdrawal Failed',
        description: error.message || 'Failed to process withdrawal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={fetchPreview}
        disabled={loading}
        variant="destructive"
        size="sm"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          'Withdraw'
        )}
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw from {positionName}</AlertDialogTitle>
            <AlertDialogDescription>
              Review the withdrawal details below
            </AlertDialogDescription>
          </AlertDialogHeader>

          {preview && (
            <div className="space-y-4 py-4">
              {/* Warning for early withdrawal */}
              {preview.penalty_applied && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-destructive">Early Withdrawal Penalty</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You've only held this position for {preview.days_locked} days. 
                      Minimum lock period is {preview.min_days_required} days.
                      A {((preview.penalty_amount / (preview.total_amount + preview.penalty_amount)) * 100).toFixed(1)}% 
                      penalty will be applied.
                    </p>
                  </div>
                </div>
              )}

              {/* Withdrawal breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Withdrawal Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/5">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Principal</span>
                    </div>
                    <span className="font-semibold">${preview.principal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Yield Earned</span>
                    </div>
                    <span className="font-semibold text-green-500">
                      +${preview.yield_earned.toFixed(2)}
                    </span>
                  </div>

                  {preview.penalty_applied && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm">Early Withdrawal Penalty</span>
                      </div>
                      <span className="font-semibold text-destructive">
                        -${preview.penalty_amount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="h-px bg-border my-2" />

                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Total You'll Receive</span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      ${preview.total_amount.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground">
                This withdrawal is final and cannot be undone. The funds will be available in your wallet.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdraw}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Withdrawal'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
