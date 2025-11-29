import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

// Import the wallet context directly to check if it's available
import { useConnectWallet } from '@web3-onboard/react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Use Web3-Onboard hook directly (it's safe and doesn't throw)
  const [{ wallet }] = useConnectWallet();
  const isWalletConnected = !!wallet;

  useEffect(() => {
    // Allow access if user is logged in OR wallet is connected
    if (!loading && !user && !isWalletConnected) {
      navigate('/auth');
    }
  }, [user, loading, isWalletConnected, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow access if user is logged in OR wallet is connected
  if (!user && !isWalletConnected) {
    return null;
  }

  return <>{children}</>;
};
