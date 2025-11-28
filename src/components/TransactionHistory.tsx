import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Deposit {
  id: string;
  amount: number;
  chain: string;
  status: string;
  tx_hash: string;
  created_at: string;
  confirmed_at: string | null;
  points_awarded: number;
}

export const TransactionHistory = () => {
  const { user } = useAuth();
  const { address } = useWallet();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeposits = async () => {
      setLoading(true);
      
      try {
        // If user is logged in and has wallet, use wallet address
        // If user is logged in without wallet, use user.id
        // If not logged in but wallet connected, use wallet address
        
        if (address) {
          // Use RPC function with wallet address
          const { data, error } = await supabase.rpc('get_user_deposits', {
            p_wallet_address: address.toLowerCase()
          });

          if (!error && data) {
            setDeposits(data);
          }
        } else if (user) {
          // Fallback to direct query with user.id
          const { data, error } = await supabase
            .from('deposits')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setDeposits(data);
          }
        }
      } catch (error) {
        console.error('Error fetching deposits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeposits();

    // Subscribe to real-time updates only if we have user or address
    if (user || address) {
      const channel = supabase
        .channel('deposits-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deposits',
          },
          () => {
            fetchDeposits();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, address]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getExplorerUrl = (chain: string, txHash: string) => {
    if (chain === 'base') {
      return `https://sepolia.basescan.org/tx/${txHash}`;
    } else if (chain === 'solana') {
      return `https://solscan.io/tx/${txHash}`;
    }
    return '#';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!user && !address) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        <div className="text-center py-8 text-muted-foreground">
          Please connect your wallet or sign in to view transactions.
        </div>
      </Card>
    );
  }

  if (deposits.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        <div className="text-center py-8 text-muted-foreground">
          No transactions yet. Make your first deposit to get started!
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Transaction</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits.map((deposit) => (
              <TableRow key={deposit.id}>
                <TableCell className="font-medium">
                  {format(new Date(deposit.created_at), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {deposit.chain}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">
                  {deposit.amount} {deposit.chain === 'base' ? 'ETH' : 'SOL'}
                </TableCell>
                <TableCell className="font-semibold text-primary">
                  +{deposit.points_awarded}
                </TableCell>
                <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                <TableCell>
                  <a
                    href={getExplorerUrl(deposit.chain, deposit.tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline text-sm"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
