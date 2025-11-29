import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePageView } from '@/hooks/useActivityLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, DollarSign, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Analytics = () => {
  usePageView('Personal Analytics');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [depositsData, setDepositsData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalDeposits: 0,
    totalDeposited: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      try {
        // Fetch points history
        const { data: points } = await supabase
          .from('points_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        // Fetch deposits
        const { data: deposits } = await supabase
          .from('deposits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        // Fetch profile for total points
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('id', user.id)
          .maybeSingle();

        // Process points history for chart
        const pointsChartData = points?.map((p) => ({
          date: new Date(p.created_at).toLocaleDateString(),
          points: Number(p.points),
        })) || [];

        // Process deposits for chart
        const depositsChartData = deposits?.map((d) => ({
          date: new Date(d.created_at).toLocaleDateString(),
          amount: Number(d.amount),
          status: d.status,
        })) || [];

        setPointsHistory(pointsChartData);
        setDepositsData(depositsChartData);
        setStats({
          totalPoints: profile?.total_points || 0,
          totalDeposits: deposits?.length || 0,
          totalDeposited: deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0,
        });
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Personal Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your performance and growth
              </p>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Earned across all activities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeposits}</div>
              <p className="text-xs text-muted-foreground">
                Confirmed transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposited</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalDeposited.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all chains
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Points Growth</CardTitle>
              <CardDescription>Your points earned over time</CardDescription>
            </CardHeader>
            <CardContent>
              {pointsHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={pointsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="points" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No points data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deposits History</CardTitle>
              <CardDescription>Your deposit amounts over time</CardDescription>
            </CardHeader>
            <CardContent>
              {depositsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={depositsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No deposits data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
