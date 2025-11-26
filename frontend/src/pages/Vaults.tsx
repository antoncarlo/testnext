import { useState } from 'react';
import { usePageView } from '@/hooks/useActivityLogger';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Home, Vault, TrendingUp, Wallet, BarChart3 } from 'lucide-react';
import { VaultsList } from '@/components/vaults/VaultsList';
import { VaultDeposit } from '@/components/vaults/VaultDeposit';
import { VaultPositions } from '@/components/vaults/VaultPositions';
import { VaultAnalytics } from '@/components/vaults/VaultAnalytics';

const Vaults = () => {
  usePageView('Vaults');
  const [selectedVault, setSelectedVault] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Vault className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                DeFi Vaults
              </h1>
              <p className="text-muted-foreground mt-1">
                Earn yields across multiple DeFi protocols
              </p>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="available" className="flex items-center gap-2">
              <Vault className="h-4 w-4" />
              Available Vaults
            </TabsTrigger>
            <TabsTrigger value="deposit" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              My Positions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <VaultsList onSelectVault={setSelectedVault} />
          </TabsContent>

          <TabsContent value="deposit">
            <VaultDeposit selectedVaultId={selectedVault} />
          </TabsContent>

          <TabsContent value="positions">
            <VaultPositions />
          </TabsContent>

          <TabsContent value="analytics">
            <VaultAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Vaults;
