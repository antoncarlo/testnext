import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, DollarSign, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { VaultWithdraw } from './VaultWithdraw';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Position {
  id: string;
  amount: number;
  current_value: number;
  points_earned: number;
  status: string;
  created_at: string;
  auto_compound: boolean;
  defi_strategies: {
    name: string;
    base_apy: number;
    protocol_type: string;
  };
}

export const VaultPositions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalDeposited: 0,
    totalValue: 0,
    totalPoints: 0,
    totalYield: 0,
  });

  useEffect(() => {
    const fetchPositions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch positions
        const { data: positionsData, error: positionsError } = await supabase
          .from('user_defi_positions')
          .select(`
            *,
            defi_strategies (name, base_apy, protocol_type)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (positionsError) throw positionsError;

        setPositions(positionsData || []);

        // Calculate summary
        const totalDeposited = positionsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const totalValue = positionsData?.reduce((sum, p) => sum + Number(p.current_value), 0) || 0;
        const totalPoints = positionsData?.reduce((sum, p) => sum + Number(p.points_earned), 0) || 0;

        setSummary({
          totalDeposited,
          totalValue,
          totalPoints,
          totalYield: totalValue - totalDeposited,
        });
      } catch (error) {
        console.error('Error fetching positions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load positions',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();

    // Real-time subscription
    const channel = supabase
      .channel('user_defi_positions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_defi_positions',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchPositions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggleAutoCompound = async (positionId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('user_defi_positions')
        .update({ auto_compound: !currentValue })
        .eq('id', positionId);

      if (error) throw error;

      toast({
        title: 'Auto-Compound Updated',
        description: `Auto-compound ${!currentValue ? 'enabled' : 'disabled'}`,
      });

      // Refetch positions
      const { data: positionsData } = await supabase
        .from('user_defi_positions')
        .select(`
          *,
          defi_strategies (name, base_apy, protocol_type)
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setPositions(positionsData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update auto-compound',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Please sign in to view your positions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposited</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.totalDeposited.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.totalYield >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${summary.totalYield.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalPoints.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
          <CardDescription>Your current vault deposits</CardDescription>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active positions yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vault</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Deposited</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Yield</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Auto-Compound</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => {
                  const yield_value = Number(position.current_value) - Number(position.amount);
                  return (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">
                        {position.defi_strategies.name}
                      </TableCell>
                      <TableCell className="capitalize">
                        {position.defi_strategies.protocol_type}
                      </TableCell>
                      <TableCell>${Number(position.amount).toLocaleString()}</TableCell>
                      <TableCell>${Number(position.current_value).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={yield_value >= 0 ? 'text-green-500' : 'text-red-500'}>
                          ${yield_value.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {Number(position.points_earned).toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={position.auto_compound}
                            onCheckedChange={() => toggleAutoCompound(position.id, position.auto_compound)}
                          />
                          <Label className="text-xs">
                            {position.auto_compound ? 'On' : 'Off'}
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell>
                        <VaultWithdraw
                          positionId={position.id}
                          positionName={position.defi_strategies.name}
                          onWithdrawComplete={() => {
                            // Refetch positions after withdrawal
                            const refetch = async () => {
                              const { data } = await supabase
                                .from('user_defi_positions')
                                .select(`
                                  *,
                                  defi_strategies (name, base_apy, protocol_type)
                                `)
                                .eq('user_id', user!.id)
                                .eq('status', 'active')
                                .order('created_at', { ascending: false });
                              setPositions(data || []);
                            };
                            refetch();
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
