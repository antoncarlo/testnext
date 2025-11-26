import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Activity, TrendingUp, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  wallet_address: string;
  email: string | null;
  total_points: number;
  current_tier: string;
  created_at: string;
}

interface Deposit {
  id: string;
  amount: number;
  chain: string;
  status: string;
  tx_hash: string;
  created_at: string;
}

interface Activity {
  id: string;
  activity_type: string;
  description: string | null;
  created_at: string;
}

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointsReason, setPointsReason] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    
    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      setUser(profile);
    }

    // Fetch deposits
    const { data: depositsData } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (depositsData) {
      setDeposits(depositsData);
    }

    // Fetch activity
    const { data: activityData } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (activityData) {
      setActivities(activityData);
    }

    setLoading(false);
  };

  const handleAddPoints = async () => {
    if (!userId || !pointsToAdd || !pointsReason) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const points = parseFloat(pointsToAdd);
    if (isNaN(points)) {
      toast({
        title: 'Error',
        description: 'Invalid points value',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('update_user_points', {
        p_user_id: userId,
        p_points: points,
        p_action_type: 'admin_adjustment',
        p_description: pointsReason,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Points updated successfully',
      });

      setPointsToAdd('');
      setPointsReason('');
      fetchUserData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update points',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>User not found</div>
      </div>
    );
  }

  const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0);
  const confirmedDeposits = deposits.filter(d => d.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Details</h1>
              <p className="text-muted-foreground mt-1">
                {user.email || 'No email'}
              </p>
            </div>
            <Badge className="text-lg px-4 py-2">{user.current_tier}</Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Points</p>
                <p className="text-2xl font-bold">{Number(user.total_points).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Coins className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Deposits</p>
                <p className="text-2xl font-bold">{totalDeposits.toFixed(4)} ETH</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Confirmed Deposits</p>
                <p className="text-2xl font-bold">{confirmedDeposits}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* User Info */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">User Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Wallet Address</Label>
              <p className="font-mono mt-1">{user.wallet_address}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Member Since</Label>
              <p className="mt-1">{format(new Date(user.created_at), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
        </Card>

        {/* Manage Points */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Manage Points</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="points">Points to Add/Remove</Label>
              <Input
                id="points"
                type="number"
                placeholder="Enter points (negative to remove)"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Why are you adjusting points?"
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                rows={1}
              />
            </div>
          </div>
          <Button onClick={handleAddPoints} className="mt-4">
            Update Points
          </Button>
        </Card>

        {/* Deposits Table */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Deposit History</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TX Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No deposits yet
                  </TableCell>
                </TableRow>
              ) : (
                deposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell>{format(new Date(deposit.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell className="font-mono">{deposit.amount}</TableCell>
                    <TableCell><Badge variant="outline">{deposit.chain}</Badge></TableCell>
                    <TableCell><Badge>{deposit.status}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">
                      {deposit.tx_hash.slice(0, 10)}...{deposit.tx_hash.slice(-8)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Activity Log */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Activity Type</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No activity recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell><Badge variant="outline">{activity.activity_type}</Badge></TableCell>
                    <TableCell>{activity.description || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default UserDetail;
