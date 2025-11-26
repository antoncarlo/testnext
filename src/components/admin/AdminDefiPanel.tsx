import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, RefreshCw, TrendingUp, Users, DollarSign, Award } from 'lucide-react';

interface DefiPosition {
  id: string;
  user_id: string;
  amount: number;
  current_value: number;
  points_earned: number;
  status: string;
  created_at: string;
  defi_strategies: {
    name: string;
    protocol_type: string;
    base_apy: number;
    points_multiplier: number;
  };
  profiles: {
    wallet_address: string;
  };
}

interface DefiStats {
  total_tvl: number;
  total_positions: number;
  active_positions: number;
  total_yield: number;
  total_points_awarded: number;
}

export function AdminDefiPanel() {
  const { toast } = useToast();
  const [positions, setPositions] = useState<DefiPosition[]>([]);
  const [stats, setStats] = useState<DefiStats>({
    total_tvl: 0,
    total_positions: 0,
    active_positions: 0,
    total_yield: 0,
    total_points_awarded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all positions with strategy info
      const { data: positionsData, error: positionsError } = await supabase
        .from('user_defi_positions')
        .select(`
          *,
          defi_strategies(name, protocol_type, base_apy, points_multiplier)
        `)
        .order('created_at', { ascending: false });

      if (positionsError) throw positionsError;

      if (!positionsData || positionsData.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch user profiles separately
      const userIds = [...new Set(positionsData.map((p) => p.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, wallet_address')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to positions
      const profilesMap = new Map(
        profilesData?.map((p) => [p.id, p.wallet_address]) || []
      );

      const enrichedPositions = positionsData.map((pos) => ({
        ...pos,
        profiles: {
          wallet_address: profilesMap.get(pos.user_id) || 'Unknown',
        },
      }));

      setPositions(enrichedPositions);

      // Calculate aggregate stats
      const totalTVL = enrichedPositions
        .filter((p) => p.status === 'active')
        .reduce((sum, p) => sum + Number(p.current_value), 0);

      const totalYield = enrichedPositions
        .filter((p) => p.status === 'active')
        .reduce((sum, p) => sum + (Number(p.current_value) - Number(p.amount)), 0);

      const totalPoints = enrichedPositions.reduce(
        (sum, p) => sum + Number(p.points_earned),
        0
      );

      setStats({
        total_tvl: totalTVL,
        total_positions: enrichedPositions.length,
        active_positions: enrichedPositions.filter((p) => p.status === 'active').length,
        total_yield: totalYield,
        total_points_awarded: totalPoints,
      });
    } catch (error) {
      console.error('Error fetching DeFi data:', error);
      toast({
        title: 'Error loading DeFi data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpdate = async () => {
    setUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-defi-yields', {
        body: {},
      });

      if (error) throw error;

      toast({
        title: 'Yields Updated Successfully',
        description: data.message || 'All active positions have been updated',
      });

      // Refresh data after update
      await fetchData();
    } catch (error: any) {
      console.error('Error updating yields:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update yields',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total TVL</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_tvl)}</div>
            <p className="text-xs text-muted-foreground">Active positions value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_positions}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.total_positions} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(stats.total_yield)}
            </div>
            <p className="text-xs text-muted-foreground">All-time returns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Awarded</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_points_awarded.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Total DeFi points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Update</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleManualUpdate}
              disabled={updating}
              className="w-full"
              size="sm"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Yields
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All DeFi Positions</CardTitle>
          <CardDescription>
            Monitor all user positions across DeFi strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No DeFi positions yet
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Protocol Type</TableHead>
                    <TableHead className="text-right">Deposited</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">Yield</TableHead>
                    <TableHead className="text-right">APY</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => {
                    const yieldValue = Number(position.current_value) - Number(position.amount);
                    const yieldPercent =
                      (yieldValue / Number(position.amount)) * 100;

                    return (
                      <TableRow key={position.id}>
                        <TableCell className="font-mono text-xs">
                          {truncateAddress(position.profiles.wallet_address)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {position.defi_strategies.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground capitalize">
                          {position.defi_strategies.protocol_type.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(position.amount))}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(position.current_value))}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            yieldValue >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {formatCurrency(yieldValue)}
                          <br />
                          <span className="text-xs">
                            ({yieldPercent >= 0 ? '+' : ''}
                            {yieldPercent.toFixed(2)}%)
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-green-500 font-medium">
                          {position.defi_strategies.base_apy.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Award className="h-3 w-3 text-yellow-500" />
                            <span className="font-semibold">
                              {Number(position.points_earned).toFixed(0)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({position.defi_strategies.points_multiplier}x)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              position.status === 'active' ? 'default' : 'secondary'
                            }
                          >
                            {position.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(position.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
