import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWalletImproved } from '@/hooks/useWalletImproved';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { address, isConnected } = useWalletImproved();
  const navigate = useNavigate();

  useEffect(() => {
    // Allow access if user is logged in OR wallet is connected
    if (!loading && !user && !isConnected) {
      navigate('/auth');
    }
  }, [user, loading, isConnected, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow access if user is logged in OR wallet is connected
  if (!user && !isConnected) {
    return null;
  }

  return <>{children}</>;
};
