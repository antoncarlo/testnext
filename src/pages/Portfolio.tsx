```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/contexts/WalletContext';
import { usePageView } from '@/hooks/useActivityLogger';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, HelpCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  total_points: number;
  current_tier: string;
  wallet_address: string;
}

interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  total_points: number;
}

const tierColors: Record<string, string> = {
  Bronze: 'bg-orange-500',
  Silver: 'bg-slate-400',
  Gold: 'bg-yellow-500',
  Platinum: 'bg-purple-500',
  Diamond: 'bg-blue-500',
};

export default function Portfolio() {
  usePageView('Portfolio');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address, isConnected } = useWallet();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('total_points, current_tier, wallet_address')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch leaderboard
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('leaderboard')
          .select('rank, wallet_address, total_points')
          .order('rank', { ascending: true })
          .limit(10);

        if (leaderboardError) throw leaderboardError;
        setLeaderboard(leaderboardData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({ title: 'Address copied to clipboard' });
  };

  const truncateAddress = (addr: string) => {
    return addr.slice(0, 6) + '...' + addr.slice(-6);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                AUM: <span className="font-semibold text-foreground">$40.1M</span>
              </span>
              {isConnected && (
                <Button onClick={() => navigate('/auth')}>Select Wallet</Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-4xl font-bold">Portfolio</h1>
            <HelpCircle className="h-5 w-5 text-muted-foreground cursor-pointer" />
          </div>
          <p className="text-muted-foreground">
            Track your ONyc positions, points, and onchain activity in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Total ONyc Exposure</p>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">N/A</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Value (USD)</p>
                    <p className="text-2xl font-bold text-green-500">N/A</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Points Earned</p>
                    <p className="text-2xl font-bold">{profile?.total_points || 0}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Current Rank</p>
                    <p className="text-2xl font-bold text-yellow-500">N/A</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Wallet Address</p>
                  <p className="text-lg font-mono">
                    {isConnected && address ? truncateAddress(address) : 'Not connected'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📈 Points by Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  No points earned yet
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b border-border">
                    <span>Rank</span>
                    <span>Address</span>
                    <span className="text-right">Total Points</span>
                  </div>
                  {leaderboard.map((entry) => (
                    <div key={entry.rank} className="grid grid-cols-3 gap-4 items-center text-sm">
                      <span className="font-semibold">#{entry.rank}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">{truncateAddress(entry.wallet_address)}</span>
                        <Copy
                          className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                          onClick={() => copyAddress(entry.wallet_address)}
                        />
                      </div>
                      <span className="text-right font-semibold">{entry.total_points.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
```
    </div>
  );
}

