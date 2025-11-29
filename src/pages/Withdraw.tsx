import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { usePageView } from '@/hooks/useActivityLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowDownToLine, History, AlertCircle, Wallet, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const LOCK_PERIOD_DAYS = 7;
const EARLY_WITHDRAWAL_PENALTY = 0.10; // 10%
const GAS_FEE_ESTIMATE = 0.0001;
const MIN_WITHDRAWAL_AMOUNT = 0.001;

const Withdraw = () => {
  usePageView('Withdrawals');
  const { user } = useAuth();
  const { address, chainType, isConnected } = useWallet();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [chain, setChain] = useState('base');
  const [walletAddress, setWalletAddress] = useState('');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [hasLockedDeposits, setHasLockedDeposits] = useState(false);
  
  // Calculated values
  const withdrawAmount = parseFloat(amount) || 0;
  const penaltyAmount = hasLockedDeposits ? withdrawAmount * EARLY_WITHDRAWAL_PENALTY : 0;
  const gasFee = GAS_FEE_ESTIMATE;
  const netAmount = withdrawAmount - penaltyAmount - gasFee;

  // Auto-fill wallet address if connected
  useEffect(() => {
    if (isConnected && address && chainType === chain) {
      setWalletAddress(address);
    }
  }, [isConnected, address, chainType, chain]);

  // Fetch user balance and withdrawals
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setBalanceLoading(true);
      try {
        // Fetch deposits
        const { data: deposits } = await supabase
          .from('deposits')
          .select('amount, created_at, status')
          .eq('user_id', user.id)
          .eq('chain', chain)
          .eq('status', 'confirmed');

        const totalDeposited = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

        // Check for locked deposits
        const now = new Date();
        const lockPeriodMs = LOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000;
        const hasLocked = deposits?.some((d) => {
          const depositDate = new Date(d.created_at);
          return now.getTime() - depositDate.getTime() < lockPeriodMs;
        }) || false;
        setHasLockedDeposits(hasLocked);

        // Fetch withdrawals
        const { data: withdrawalData } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user.id)
          .eq('chain', chain)
          .order('created_at', { ascending: false });

        setWithdrawals(withdrawalData || []);

        const totalWithdrawn = withdrawalData
          ?.filter((w) => ['completed', 'processing'].includes(w.status))
          .reduce((sum, w) => sum + Number(w.net_amount), 0) || 0;

        setAvailableBalance(totalDeposited - totalWithdrawn);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchData();
  }, [user, chain]);

  const handleWithdraw = async () => {
    if (!amount || !walletAddress) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
      toast({
        title: 'Error',
        description: `Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT} ETH`,
        variant: 'destructive',
      });
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `Available balance: ${availableBalance.toFixed(4)} ETH`,
        variant: 'destructive',
      });
      return;
    }

    if (netAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Net amount after fees is too low',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-withdrawal', {
        body: {
          amount: withdrawAmount,
          destination_address: walletAddress,
          chain,
        },
      });

      if (error) throw error;

      toast({
        title: 'Withdrawal Requested ✅',
        description: data.withdrawal.message,
      });

      setAmount('');
      
      // Refresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast({
        title: 'Withdrawal Failed',
        description: error.message || 'Failed to process withdrawal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Withdrawals
              </h1>
              <p className="text-muted-foreground mt-1">
                Withdraw your funds to your wallet
              </p>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="grid gap-6 mb-8">
          {/* Balance Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Available Balance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading balance...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {availableBalance.toFixed(4)}
                    </span>
                    <span className="text-xl text-muted-foreground">ETH</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>on</span>
                    <Badge variant="outline" className="capitalize">
                      {chain}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdrawal Form */}
          <Card>
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
              <CardDescription>
                Withdraw your deposited funds to your wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chain">Chain</Label>
                  <Select value={chain} onValueChange={setChain}>
                    <SelectTrigger id="chain">
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="solana">Solana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (ETH)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.001"
                    min="0"
                    max={availableBalance}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {availableBalance.toFixed(4)} ETH
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet">Destination Wallet Address</Label>
                  <Input
                    id="wallet"
                    placeholder="0x... or wallet address"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                  />
                  {isConnected && chainType === chain && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✓ Using connected wallet address
                    </p>
                  )}
                </div>

                {/* Fee Breakdown */}
                {withdrawAmount > 0 && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Withdrawal Amount</span>
                      <span className="font-medium">{withdrawAmount.toFixed(4)} ETH</span>
                    </div>
                    {penaltyAmount > 0 && (
                      <div className="flex justify-between text-sm text-yellow-600 dark:text-yellow-400">
                        <span>Early Withdrawal Penalty (10%)</span>
                        <span className="font-medium">-{penaltyAmount.toFixed(4)} ETH</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gas Fee (est.)</span>
                      <span className="font-medium">-{gasFee.toFixed(4)} ETH</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between">
                      <span className="font-semibold">You will receive</span>
                      <span className="font-bold text-lg">
                        {netAmount > 0 ? netAmount.toFixed(4) : '0.0000'} ETH
                      </span>
                    </div>
                  </div>
                )}

                {/* Early Withdrawal Warning */}
                {hasLockedDeposits && withdrawAmount > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Early Withdrawal Penalty</AlertTitle>
                    <AlertDescription>
                      Some of your deposits are within the {LOCK_PERIOD_DAYS}-day lock period.
                      A {(EARLY_WITHDRAWAL_PENALTY * 100).toFixed(0)}% penalty will be applied
                      to your withdrawal.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleWithdraw}
                  disabled={loading || balanceLoading || !amount || !walletAddress || withdrawAmount > availableBalance}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Request Withdrawal'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Withdrawal History</CardTitle>
              </div>
              <CardDescription>
                Track your previous withdrawal requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No withdrawals yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Net Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">
                          {Number(w.amount).toFixed(4)} ETH
                        </TableCell>
                        <TableCell className="text-green-600 dark:text-green-400">
                          {Number(w.net_amount).toFixed(4)} ETH
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              w.status === 'completed'
                                ? 'default'
                                : w.status === 'pending'
                                ? 'secondary'
                                : w.status === 'processing'
                                ? 'outline'
                                : 'destructive'
                            }
                          >
                            {w.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(w.created_at).toLocaleDateString()}
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
    </div>
  );
};

export default Withdraw;