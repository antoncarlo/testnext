import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VaultDepositProps {
  selectedVaultId: string | null;
}

export const VaultDeposit = ({ selectedVaultId }: VaultDepositProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vaults, setVaults] = useState<any[]>([]);
  const [selectedVault, setSelectedVault] = useState<string>(selectedVaultId || '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVaults = async () => {
      const { data } = await supabase
        .from('defi_strategies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      setVaults(data || []);
    };

    fetchVaults();
  }, []);

  useEffect(() => {
    if (selectedVaultId) {
      setSelectedVault(selectedVaultId);
    }
  }, [selectedVaultId]);

  const handleDeposit = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to deposit',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedVault || !amount) {
      toast({
        title: 'Missing Information',
        description: 'Please select a vault and enter an amount',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'https://mxkdrdjbvhhwhstbocux.supabase.co/functions/v1/defi-deposit',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            strategyId: selectedVault,
            amount: parseFloat(amount),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Deposit failed');
      }

      toast({
        title: 'Deposit Successful',
        description: `Successfully deposited $${amount} into vault`,
      });

      setAmount('');
    } catch (error: any) {
      toast({
        title: 'Deposit Failed',
        description: error.message || 'Failed to process deposit',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedVaultData = vaults.find((v) => v.id === selectedVault);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Deposit into Vault</CardTitle>
          <CardDescription>
            Select a vault and enter the amount you want to deposit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vault Selection */}
          <div className="space-y-2">
            <Label>Select Vault</Label>
            <Select value={selectedVault} onValueChange={setSelectedVault}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a vault" />
              </SelectTrigger>
              <SelectContent>
                {vaults.map((vault) => (
                  <SelectItem key={vault.id} value={vault.id}>
                    {vault.name} ({vault.base_apy}% APY)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vault Info */}
          {selectedVaultData && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">APY</span>
                <span className="font-semibold text-primary">
                  {selectedVaultData.base_apy}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Points Multiplier</span>
                <span className="font-semibold">{selectedVaultData.points_multiplier}x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Protocol</span>
                <span className="font-semibold capitalize">
                  {selectedVaultData.protocol_type}
                </span>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Deposit Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          {/* Expected Returns */}
          {selectedVaultData && amount && (
            <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium">Expected Annual Return</span>
              </div>
              <p className="text-2xl font-bold text-secondary">
                ${((parseFloat(amount) * selectedVaultData.base_apy) / 100).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on current {selectedVaultData.base_apy}% APY
              </p>
            </div>
          )}

          {/* Deposit Button */}
          <Button
            onClick={handleDeposit}
            disabled={loading || !selectedVault || !amount}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Deposit into Vault'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
