import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const VaultAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vaultsPerformance, setVaultsPerformance] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all vaults with their stats
        const { data: vaults } = await supabase
          .from('defi_strategies')
          .select('*')
          .eq('is_active', true);

        // Transform for chart
        const vaultsData = vaults?.map((v) => ({
          name: v.name.substring(0, 15),
          apy: Number(v.base_apy),
          tvl: Number(v.tvl),
          multiplier: Number(v.points_multiplier),
        })) || [];

        setVaultsPerformance(vaultsData);

        // Fetch user positions over time
        const { data: positions } = await supabase
          .from('user_defi_positions')
          .select('amount, current_value, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        // Aggregate by month
        const monthlyData: Record<string, { deposited: number; value: number }> = {};
        
        positions?.forEach((p) => {
          const month = new Date(p.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          });
          
          if (!monthlyData[month]) {
            monthlyData[month] = { deposited: 0, value: 0 };
          }
          
          monthlyData[month].deposited += Number(p.amount);
          monthlyData[month].value += Number(p.current_value);
        });

        const growthData = Object.entries(monthlyData).map(([month, data]) => ({
          month,
          deposited: data.deposited,
          value: data.value,
        }));

        setUserGrowth(growthData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

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
          <p className="text-muted-foreground">Please sign in to view analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vaults Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Vaults APY Comparison</CardTitle>
          <CardDescription>Compare yields across different vaults</CardDescription>
        </CardHeader>
        <CardContent>
          {vaultsPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vaultsPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="apy" fill="hsl(var(--primary))" name="APY (%)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No vault data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* TVL Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>TVL by Vault</CardTitle>
          <CardDescription>Total value locked in each vault</CardDescription>
        </CardHeader>
        <CardContent>
          {vaultsPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vaultsPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tvl" fill="hsl(var(--secondary))" name="TVL ($)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No TVL data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Growth</CardTitle>
          <CardDescription>Your deposits vs current value over time</CardDescription>
        </CardHeader>
        <CardContent>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="deposited" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                  name="Deposited" 
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2} 
                  name="Current Value" 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No position data yet. Make your first deposit to see growth analytics.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
