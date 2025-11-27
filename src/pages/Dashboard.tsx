import { WalletConnect } from '@/components/WalletConnect';
import { DepositCard } from '@/components/DepositCard';
import { UserStats } from '@/components/UserStats';
import { TransactionHistory } from '@/components/TransactionHistory';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { usePageView } from '@/hooks/useActivityLogger';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Trophy, Home, LogOut, Copy, Check, QrCode, Shield, User, Activity, TrendingUp, ArrowDownToLine, Vault, Gift } from 'lucide-react';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const Dashboard = () => {
  const { isConnected, disconnectWallet, address, walletType, chainType } = useWallet();
  const { user, signOut } = useAuth();
  const { balance, loading: balanceLoading, symbol } = useWalletBalance();
  const { isAdmin } = useAdminCheck();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Log page view
  usePageView('Dashboard');

  const handleSignOut = async () => {
    await signOut();
    disconnectWallet();
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Wallet address copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your deposits and track your rewards
            </p>
            {user && (
              <p className="text-sm text-muted-foreground mt-1">
                Signed in as: {user.email}
              </p>
            )}
            {isConnected && address && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${walletType === 'metamask' ? 'bg-orange-500' : 'bg-purple-500'}`} />
                    <span className="text-xs font-medium text-muted-foreground">
                      {walletType === 'metamask' ? 'MetaMask' : 'Phantom'} ({chainType === 'base' ? 'Base' : 'Solana'})
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                  <div className="h-4 w-px bg-border" />
                  <span className="text-sm font-semibold">
                    {balanceLoading ? '...' : balance} {symbol}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={copyAddress}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowQR(true)}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <Link to="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link to="/activity">
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Activity
              </Button>
            </Link>
            <Link to="/withdraw">
              <Button variant="outline" size="sm">
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </Link>
            <Link to="/vaults">
              <Button variant="outline" size="sm">
                <Vault className="h-4 w-4 mr-2" />
                Vaults
              </Button>
            </Link>
            <Link to="/referral">
              <Button variant="outline" size="sm">
                <Gift className="h-4 w-4 mr-2" />
                Referral
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="outline" size="sm">
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </Button>
            </Link>
            {user && (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Wallet & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet Connection */}
            <WalletConnect />
            
            {/* User Stats */}
            {isConnected && <UserStats />}
          </div>

          {/* Center Column - Deposit Section */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DepositCard />
            
            {/* Info Card */}
            <div className="space-y-4">
              <div className="p-6 border-2 border-primary/20 rounded-lg bg-primary/5">
                <h3 className="font-semibold text-lg mb-3">How it Works</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">1.</span>
                    <span>Connect your MetaMask (Base) or Phantom (Solana) wallet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">2.</span>
                    <span>Deposit ETH to start earning points</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">3.</span>
                    <span>Earn 1000 points per ETH deposited</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">4.</span>
                    <span>Climb tiers: Bronze → Silver → Gold → Platinum → Diamond</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 border-2 border-secondary/20 rounded-lg bg-secondary/5">
                <h3 className="font-semibold text-lg mb-3">Tier Benefits</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bronze</span>
                    <span className="font-semibold">0+ points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Silver</span>
                    <span className="font-semibold">1,000+ points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gold</span>
                    <span className="font-semibold">10,000+ points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platinum</span>
                    <span className="font-semibold">50,000+ points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diamond</span>
                    <span className="font-semibold">100,000+ points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Transaction History */}
        {isConnected && user && (
          <div className="mb-8">
            <TransactionHistory />
          </div>
        )}

        {/* QR Code Dialog */}
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Wallet Address QR Code</DialogTitle>
              <DialogDescription>
                Scan this QR code to get the wallet address
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={address || ''} size={256} level="H" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  {walletType === 'metamask' ? 'MetaMask' : 'Phantom'} - {chainType === 'base' ? 'Base' : 'Solana'}
                </p>
                <p className="font-mono text-xs break-all px-4">{address}</p>
              </div>
              <Button onClick={copyAddress} variant="outline" className="w-full">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Address
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;
