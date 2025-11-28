import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, DollarSign, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


interface Vault {
  id: string;
  name: string;
  protocol_type: string;
  base_apy: number;
  points_multiplier: number;
  tvl: number;
  assets: string[];
  is_new: boolean;
  chain: string;
}

interface VaultsListProps {
  onSelectVault: (vaultId: string) => void;
}

export const VaultsList = ({ onSelectVault }: VaultsListProps) => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVaults = async () => {
      try {
        const { data, error } = await supabase
          .from('defi_strategies')
          .select('*')
          .eq('is_active', true)
          .order('base_apy', { ascending: false });

        if (error) throw error;
        setVaults(data || []);
      } catch (error) {
        console.error('Error fetching vaults:', error);
        toast({
          title: 'Error',
          description: 'Failed to load vaults',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVaults();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Vaults from Database */}
      {vaults.map((vault) => (
        <Card key={vault.id} className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-xl">{vault.name}</CardTitle>
              {vault.is_new && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  New
                </Badge>
              )}
            </div>
            <CardDescription className="capitalize">{vault.protocol_type}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* APY */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>APY</span>
              </div>
              <span className="text-xl font-bold text-primary">
                {vault.base_apy.toFixed(2)}%
              </span>
            </div>

            {/* TVL */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>TVL</span>
              </div>
              <span className="text-lg font-semibold">
                ${vault.tvl.toLocaleString()}
              </span>
            </div>

            {/* Points Multiplier */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Points Multiplier</span>
              <Badge variant="secondary">{vault.points_multiplier}x</Badge>
            </div>

            {/* Assets */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Assets</p>
              <div className="flex flex-wrap gap-2">
                {vault.assets.map((asset) => (
                  <Badge key={asset} variant="outline">
                    {asset}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Chain */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Chain</span>
              <Badge variant="outline" className="capitalize">{vault.chain}</Badge>
            </div>

            {/* Deposit Button */}
            <Button 
              onClick={() => onSelectVault(vault.id)} 
              className="w-full"
            >
              Deposit Now
            </Button>
          </CardContent>
        </Card>
      ))}

      {vaults.length === 0 && (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          No vaults available at the moment
        </div>
      )}
    </div>
  );
};
