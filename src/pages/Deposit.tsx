```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageView } from '@/hooks/useActivityLogger';
import { useWallet } from '@/contexts/WalletContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowDownUp, TrendingUp, Layers, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Deposit() {
  usePageView('Deposit');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected } = useWallet();
  const [amount, setAmount] = useState('0');

  const handleMax = () => {
    setAmount('0');
    toast({ title: 'Max amount set', description: 'Balance: 0 USDC' });
  };

  const handleDeposit = () => {
    if (!isConnected) {
      toast({ 
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }
    
    toast({ 
      title: 'Deposit feature coming soon',
      description: 'This feature will be available shortly'
    });
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

      <main className="container mx-auto px-6 py-12 max-w-2xl">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">APY</span>
              </div>
              <p className="text-2xl font-bold">13.88%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Layers className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">AUM</span>
              </div>
              <p className="text-2xl font-bold">40.1M</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Price NAV</span>
              </div>
              <p className="text-2xl font-bold">$1.0516</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-3xl font-bold text-center mb-8">Deposit</h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="text-muted-foreground">Pay</label>
                  <button 
                    onClick={handleMax}
                    className="text-yellow-500 hover:text-yellow-600 font-medium"
                  >
                    Max
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="text-4xl h-20 pr-32 font-bold"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500" />
                    <span className="font-semibold">USDC</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Balance: 0</p>
              </div>

              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <ArrowDownUp className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Receive</label>
                <div className="relative">
                  <Input
                    type="number"
                    value="0"
                    readOnly
                    placeholder="0"
                    className="text-4xl h-20 pr-32 font-bold bg-muted"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-500" />
                    <span className="font-semibold">ONyc</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleDeposit}
                className="w-full h-14 text-lg"
                disabled={!isConnected || parseFloat(amount) <= 0}
              >
                {isConnected ? 'Deposit' : 'Connect Wallet'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```