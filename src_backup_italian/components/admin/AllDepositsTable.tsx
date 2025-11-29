import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Check, X, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  chain: string;
  status: string;
  tx_hash: string;
  created_at: string;
  confirmed_at: string | null;
  profiles: {
    email: string | null;
    wallet_address: string;
  };
}

export const AllDepositsTable = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeposits();

    const channel = supabase
      .channel('admin-deposits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, fetchDeposits)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('deposits')
      .select(`
        *,
        profiles (
          email,
          wallet_address
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDeposits(data as any);
    }
    setLoading(false);
  };

  const updateDepositStatus = async (depositId: string, status: 'confirmed' | 'failed') => {
    const { error } = await supabase
      .from('deposits')
      .update({
        status,
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
      })
      .eq('id', depositId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update deposit status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Deposit ${status}`,
      });
      fetchDeposits();
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User Email', 'Wallet', 'Amount', 'Chain', 'Status', 'TX Hash'];
    const rows = deposits.map((d) => [
      format(new Date(d.created_at), 'yyyy-MM-dd HH:mm'),
      d.profiles?.email || 'N/A',
      d.profiles?.wallet_address || 'N/A',
      d.amount,
      d.chain,
      d.status,
      d.tx_hash,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deposits-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-500">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getExplorerUrl = (chain: string, txHash: string) => {
    if (chain === 'base') return `https://basescan.org/tx/${txHash}`;
    if (chain === 'solana') return `https://solscan.io/tx/${txHash}`;
    return '#';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">All Deposits</h3>
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : deposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No deposits found
                </TableCell>
              </TableRow>
            ) : (
              deposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell className="font-medium">
                    {format(new Date(deposit.created_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{deposit.profiles?.email || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {deposit.profiles?.wallet_address.slice(0, 6)}...
                        {deposit.profiles?.wallet_address.slice(-4)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {deposit.amount} {deposit.chain === 'base' ? 'ETH' : 'SOL'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {deposit.chain}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={getExplorerUrl(deposit.chain, deposit.tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      {deposit.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateDepositStatus(deposit.id, 'confirmed')}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateDepositStatus(deposit.id, 'failed')}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
