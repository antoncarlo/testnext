import DashboardLayout from '@/components/DashboardLayout';
import { WalletConnect } from '@/components/WalletConnect';
import { DepositCard } from '@/components/DepositCard';
import { UserStats } from '@/components/UserStats';
import { TransactionHistory } from '@/components/TransactionHistory';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/hooks/useAuth';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { usePageView } from '@/hooks/useActivityLogger';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Trophy, Home, LogOut, Copy, Check, QrCode, Shield, User, Activity, TrendingUp, ArrowDownToLine, Vault, Gift, Ship, Coins } from 'lucide-react';
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
        title: 'Copiato!',
        description: 'Indirizzo wallet copiato negli appunti',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header - Venetian Style */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-8 border border-primary/20">
          <div className="absolute inset-0 venetian-pattern opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Ship className="w-8 h-8 text-accent" />
              <h1 className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Benvenuto, Mercante
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Gestisci i tuoi depositi e monitora i rendimenti con l'eleganza veneziana
            </p>
            {user && (
              <p className="text-sm text-muted-foreground mt-2">
                Connesso come: <span className="font-semibold">{user.email}</span>
              </p>
            )}
            {isConnected && address && (
              <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {walletType || 'Wallet'} ({chainType === 'base-sepolia' ? 'Base Sepolia' : chainType === 'base' ? 'Base' : 'Unknown Chain'})
                    </span>
                  </div>
                  <div className="h-4 w-px bg-border" />
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
                    className="h-7 w-7 p-0"
                    onClick={copyAddress}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setShowQR(true)}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            
              {/* Info Card - Venetian Style */}
              <div className="space-y-4">
                <Card className="p-6 border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Coins className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Come Funziona
                    </h3>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold text-base">1.</span>
                      <span>Connetti il tuo wallet su Base Chain (MetaMask, Trust Wallet, WalletConnect)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold text-base">2.</span>
                      <span>Deposita ETH per iniziare a guadagnare punti</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold text-base">3.</span>
                      <span>Guadagna 1000 punti per ogni ETH depositato</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold text-base">4.</span>
                      <span>Scala i livelli: Bronzo → Argento → Oro → Platino → Diamante</span>
                    </li>
                  </ul>
                </Card>

                <Card className="p-6 border-secondary/20 bg-secondary/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Benefici per Livello
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">🥉 Bronzo</span>
                      <span className="font-semibold">0+ punti</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">🥈 Argento</span>
                      <span className="font-semibold">1,000+ punti</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">🥇 Oro</span>
                      <span className="font-semibold">10,000+ punti</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">💎 Platino</span>
                      <span className="font-semibold">50,000+ punti</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">💠 Diamante</span>
                      <span className="font-semibold">100,000+ punti</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        {isConnected && user && (
          <div>
            <TransactionHistory />
          </div>
        )}

        {/* QR Code Dialog */}
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>
                QR Code Indirizzo Wallet
              </DialogTitle>
              <DialogDescription>
                Scansiona questo QR code per ottenere l'indirizzo del wallet
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={address || ''} size={256} level="H" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  {walletType || 'Wallet'} - {chainType === 'base-sepolia' ? 'Base Sepolia' : chainType === 'base' ? 'Base' : 'Unknown Chain'}
                </p>
                <p className="font-mono text-xs break-all px-4">{address}</p>
              </div>
              <Button onClick={copyAddress} variant="outline" className="w-full">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copiato!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copia Indirizzo
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
