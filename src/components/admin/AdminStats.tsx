import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Users, TrendingUp, Coins, Activity } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalDeposits: number;
  totalPoints: number;
  pendingDeposits: number;
}

export const AdminStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDeposits: 0,
    totalPoints: 0,
    pendingDeposits: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total users
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get total deposits and sum
        const { data: depositsData } = await supabase
          .from('deposits')
          .select('amount, status');

        const totalDeposits = depositsData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
        const pendingDeposits = depositsData?.filter(d => d.status === 'pending').length || 0;

        // Get total points
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('total_points');

        const totalPoints = profilesData?.reduce((sum, p) => sum + Number(p.total_points || 0), 0) || 0;

        setStats({
          totalUsers: usersCount || 0,
          totalDeposits,
          totalPoints,
          pendingDeposits,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Deposits',
      value: `${stats.totalDeposits.toFixed(4)} ETH`,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Points',
      value: stats.totalPoints.toLocaleString(),
      icon: Coins,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Pending Deposits',
      value: stats.pendingDeposits,
      icon: Activity,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
