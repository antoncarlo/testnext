import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageView } from '@/hooks/useActivityLogger';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, TrendingUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Strategy {
  id: string;
  name: string;
  protocol_type: string;
  assets: string[];
  base_apy: number;
  points_multiplier: number;
  tvl: number;
  is_new: boolean;
  metadata: any;
}

interface UserPosition {
  id: string;
  amount: number;
  current_value: number;
  points_earned: number;
  created_at: string;
  defi_strategies: Strategy;
}

export default function DeFiOpportunities() {
  usePageView('DeFiOpportunities');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    fetchStrategies();
    if (user) {
      fetchUserPositions();
    }
  }, [user]);

  const fetchStrategies = async () => {
    try {
      const { data, error } = await supabase
        .from('defi_strategies')
        .select('*')
        .eq('is_active', true)
        .order('tvl', { ascending: false });

      if (error) throw error;
      setStrategies(data || []);
    } catch (error) {
      console.error('Error fetching strategies:', error);
      toast({ title: 'Error loading strategies', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPositions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_defi_positions')
        .select('*, defi_strategies(*)')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      setUserPositions(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const handleDeposit = async () => {
    if (!user) {
      toast({ title: 'Please sign in first', variant: 'destructive' });
      return;
    }

    if (!selectedStrategy || !depositAmount || parseFloat(depositAmount) <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    setDepositing(true);

    try {
      const { data, error } = await supabase.functions.invoke('defi-deposit', {
        body: {
          strategyId: selectedStrategy.id,
          amount: parseFloat(depositAmount),
        },
      });

      if (error) throw error;

      toast({
        title: 'Deposit Successful!',
        description: `Deposited ${depositAmount} into ${selectedStrategy.name}`,
      });

      setDepositDialogOpen(false);
      setDepositAmount('');
      fetchUserPositions();
      fetchStrategies();
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({
        title: 'Deposit Failed',
        description: error.message || 'Failed to process deposit',
        variant: 'destructive',
      });
    } finally {
      setDepositing(false);
    }
  };

  const openDepositDialog = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setDepositDialogOpen(true);
  };

  const formatTVL = (tvl: number) => {
    if (tvl >= 1000000) return `$${(tvl / 1000000).toFixed(2)}M`;
    if (tvl >= 1000) return `$${(tvl / 1000).toFixed(2)}K`;
    return `$${tvl.toFixed(2)}`;
  };

  const protocolTypeLabels: Record<string, string> = {
    liquidity_provision: 'Liquidity Provision',
    looping: 'Looping',
    yield_trading: 'Yield Trading',
  };

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
              <Button>Select Wallet</Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">DeFi Opportunities</h1>
          <p className="text-muted-foreground">
            Deposit ONyc to boost points and unlock additional yield through partner DeFi strategies.
          </p>
        </div>

        {userPositions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Active Positions
              </CardTitle>
              <CardDescription>Track your DeFi investments and earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPositions.map((position) => (
                  <div key={position.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-semibold">{position.defi_strategies.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Deposited: {position.amount.toFixed(2)} • 
                        Current: {position.current_value.toFixed(2)} • 
                        Points: {position.points_earned.toFixed(0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${position.current_value >= position.amount ? 'text-green-500' : 'text-red-500'}`}>
                        {((position.current_value - position.amount) / position.amount * 100).toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor((Date.now() - new Date(position.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {strategies.slice(0, 3).map((strategy) => (
                <Card key={strategy.id} className="relative">
                  {strategy.is_new && (
                    <Badge className="absolute top-4 right-4 bg-teal-500 hover:bg-teal-600">
                      NEW
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        {strategy.name[0]}
                      </div>
                      {strategy.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Activity:</span>
                        <span className="font-medium">{protocolTypeLabels[strategy.protocol_type]}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Assets:</span>
                        <div className="flex gap-1">
                          {strategy.assets.map((asset, idx) => (
                            <span key={idx} className="w-5 h-5 rounded-full bg-yellow-500" title={asset} />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">APY:</span>
                        <span className="font-medium text-green-500">
                          {strategy.base_apy > 0 ? `${strategy.base_apy.toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">TVL:</span>
                        <span className="font-medium">{formatTVL(strategy.tvl)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Reward:</span>
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
                          {strategy.points_multiplier}x Points
                        </Badge>
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => openDepositDialog(strategy)}>
                      Deposit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocol</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Assets</TableHead>
                      <TableHead>TVL</TableHead>
                      <TableHead>APY</TableHead>
                      <TableHead>Points Boost</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategies.map((strategy) => (
                      <TableRow key={strategy.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                              {strategy.name[0]}
                            </div>
                            {strategy.name}
                          </div>
                        </TableCell>
                        <TableCell>{protocolTypeLabels[strategy.protocol_type]}</TableCell>
                        <TableCell>{strategy.assets.join(', ')}</TableCell>
                        <TableCell>{formatTVL(strategy.tvl)}</TableCell>
                        <TableCell className="text-green-500 font-medium">
                          {strategy.base_apy > 0 ? `${strategy.base_apy.toFixed(2)}%` : 'N/A'}
                        </TableCell>
                        <TableCell>{strategy.points_multiplier}x</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => openDepositDialog(strategy)}>
                            Deposit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit into {selectedStrategy?.name}</DialogTitle>
            <DialogDescription>
              Enter the amount you want to deposit. You'll earn {selectedStrategy?.points_multiplier}x points
              {selectedStrategy?.base_apy > 0 && ` and ${selectedStrategy.base_apy.toFixed(2)}% APY`}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={depositing}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDeposit}
                disabled={depositing || !depositAmount || parseFloat(depositAmount) <= 0}
                className="flex-1"
              >
                {depositing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  'Confirm Deposit'
                )}
              </Button>
              <Button variant="outline" onClick={() => setDepositDialogOpen(false)} disabled={depositing}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
