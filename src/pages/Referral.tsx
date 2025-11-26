import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePageView } from '@/hooks/useActivityLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Users, Gift, Copy, Check, TrendingUp, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
}

interface Referral {
  id: string;
  referee_id: string;
  status: string;
  referrer_points_earned: number;
  referee_first_deposit_amount: number;
  created_at: string;
  activated_at: string | null;
  profiles: {
    wallet_address: string;
    email: string;
  };
}

const Referral = () => {
  usePageView('Referral');
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarned: 0,
  });

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get user's referral code
        const { data: profile } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', user.id)
          .single();

        if (profile) {
          setReferralCode(profile.referral_code || '');
        }

        // Get referrals where user is referrer
        const { data: referralsData, error: referralsError } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false });

        if (referralsError) {
          console.error('Error fetching referrals:', referralsError);
        }

        // Fetch referee profiles separately
        const referralsList: Referral[] = [];
        for (const ref of referralsData || []) {
          const { data: refereeProfile } = await supabase
            .from('profiles')
            .select('wallet_address, email')
            .eq('id', ref.referee_id)
            .single();

          referralsList.push({
            ...ref,
            profiles: refereeProfile || { wallet_address: 'Unknown', email: null },
          });
        }

        setReferrals(referralsList);

        // Calculate stats
        const total = referralsList?.length || 0;
        const active = referralsList?.filter((r) => r.status === 'active').length || 0;
        const earned = referralsList?.reduce((sum, r) => sum + Number(r.referrer_points_earned), 0) || 0;

        setStats({
          totalReferrals: total,
          activeReferrals: active,
          totalEarned: earned,
        });
      } catch (error) {
        console.error('Error fetching referral data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [user]);

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Referral code copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">Please sign in to access referrals</p>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Referral Program
              </h1>
              <p className="text-muted-foreground mt-1">
                Earn rewards by inviting friends
              </p>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeReferrals} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEarned.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From referral bonuses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bonus Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">10%</div>
              <p className="text-xs text-muted-foreground">
                Of referee's first deposit
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
            <CardDescription>
              Share this code with friends to earn rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="font-mono text-lg"
              />
              <Button onClick={copyCode} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-semibold mb-2">Share your referral link:</p>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/auth?ref=${referralCode}`}
                  readOnly
                  className="text-sm"
                />
                <Button onClick={copyReferralLink} variant="outline">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/5 space-y-2">
              <p className="font-semibold text-sm">How it works:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Share your referral code with friends</li>
                <li>• They sign up and make their first vault deposit</li>
                <li>• You earn 10% of their deposit in bonus points</li>
                <li>• They get 5% bonus points on their deposit</li>
                <li>• Win-win for everyone! 🎉</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
            <CardDescription>Track your referred users and earnings</CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No referrals yet. Start sharing your code!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>First Deposit</TableHead>
                    <TableHead>Your Earnings</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-mono text-sm">
                        {referral.profiles.email || 
                          `${referral.profiles.wallet_address.substring(0, 6)}...${referral.profiles.wallet_address.slice(-4)}`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            referral.status === 'active'
                              ? 'default'
                              : referral.status === 'pending'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {referral.referee_first_deposit_amount > 0
                          ? `$${Number(referral.referee_first_deposit_amount).toLocaleString()}`
                          : '-'}
                      </TableCell>
                      <TableCell className="font-semibold text-green-500">
                        {referral.referrer_points_earned > 0
                          ? `+${Number(referral.referrer_points_earned).toLocaleString()}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(referral.created_at).toLocaleDateString()}
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

export default Referral;
