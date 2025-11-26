import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePageView } from '@/hooks/useActivityLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Activity as ActivityIcon, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Activity = () => {
  usePageView('Activity History');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;

      try {
        let query = supabase
          .from('user_activity')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (filterType !== 'all') {
          query = query.eq('activity_type', filterType);
        }

        const { data, error } = await query;

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user, filterType]);

  const getActivityBadge = (type: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      login: { variant: 'default', label: 'Login' },
      page_view: { variant: 'secondary', label: 'Page View' },
      deposit_confirmed: { variant: 'default', label: 'Deposit' },
      deposit_failed: { variant: 'destructive', label: 'Failed' },
      defi_deposit: { variant: 'default', label: 'DeFi Deposit' },
      defi_withdraw: { variant: 'secondary', label: 'DeFi Withdraw' },
    };

    const config = badges[type] || { variant: 'outline', label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ActivityIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Activity History
              </h1>
              <p className="text-muted-foreground mt-1">
                Complete log of your platform activity
              </p>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>All your actions on the platform</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="login">Logins</SelectItem>
                    <SelectItem value="page_view">Page Views</SelectItem>
                    <SelectItem value="deposit_confirmed">Deposits</SelectItem>
                    <SelectItem value="defi_deposit">DeFi Deposits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activities found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{getActivityBadge(activity.activity_type)}</TableCell>
                      <TableCell>{activity.description || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Activity;
