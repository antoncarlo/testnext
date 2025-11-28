import { usePageView } from '@/hooks/useActivityLogger';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Home, Shield, TrendingUp, AlertCircle } from 'lucide-react';
import { VaultDashboard } from '@/components/VaultDashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import '@/components/VaultDashboard.nextblock.css';

const DeFiVault = () => {
  usePageView('DeFiVault');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                NextBlock DeFi Vault
              </h1>
              <p className="text-muted-foreground mt-1">
                Secure yield farming with emergency protection
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

        {/* Info Banner */}
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Production Ready Vault</AlertTitle>
          <AlertDescription>
            This vault is fully tested and verified on Base Sepolia. Protected by a 2/3 multisig treasury for emergency situations.
            <a 
              href="https://sepolia.basescan.org/address/0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 text-primary hover:underline"
            >
              View Contract →
            </a>
          </AlertDescription>
        </Alert>

        {/* Main Vault Dashboard */}
        <VaultDashboard />

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Secure Treasury</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Protected by a 2/3 multisig Safe wallet for emergency fund management
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Yield Farming</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Earn yields through automated DeFi strategies with 8.5% base APY
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Emergency Mode</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Withdrawals always available, even during emergency situations
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <Link to="/vaults">
            <Button variant="outline" size="sm">
              View All Vaults
            </Button>
          </Link>
          <a 
            href="https://app.safe.global/home?safe=basesep:0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              Treasury Dashboard
            </Button>
          </a>
          <a 
            href="https://sepolia.basescan.org/address/0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              View on BaseScan
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DeFiVault;
