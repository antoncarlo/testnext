import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { Wallet, LogOut } from 'lucide-react';

export const WalletConnect = () => {
  const { walletType, chainType, address, isConnected, connectWallet, disconnectWallet } = useWallet();
  const { user, signOut } = useAuth();

  const handleDisconnect = async () => {
    // If user is authenticated via wallet (email contains @wallet.), sign them out too
    if (user?.email?.includes('@wallet.')) {
      await signOut();
    }
    disconnectWallet();
  };

  if (isConnected && address) {
    return (
      <Card className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {walletType === 'metamask' ? 'MetaMask' : 'Phantom'} ({chainType === 'base' ? 'Base' : 'Solana'})
            </p>
            <p className="font-mono font-medium">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Connect Your Wallet</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button
          onClick={() => connectWallet('metamask')}
          className="h-auto py-4 flex flex-col gap-2"
          variant="outline"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <span className="font-semibold">MetaMask</span>
          <span className="text-xs text-muted-foreground">Connect to Base</span>
        </Button>
        <Button
          onClick={() => connectWallet('phantom')}
          className="h-auto py-4 flex flex-col gap-2"
          variant="outline"
        >
          <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
            <Wallet className="h-6 w-6 text-secondary" />
          </div>
          <span className="font-semibold">Phantom</span>
          <span className="text-xs text-muted-foreground">Connect to Solana</span>
        </Button>
      </div>
    </Card>
  );
};
