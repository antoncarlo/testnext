import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/hooks/useWallet';
import { TrendingUp, Award, Coins, Ship } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
  total_points: number;
  current_tier: string;
  wallet_address: string;
}

const tierColors: Record<string, string> = {
  Diamond: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
  Platinum: 'bg-slate-400/20 text-slate-300 border-slate-400/50',
  Gold: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  Silver: 'bg-gray-400/20 text-gray-300 border-gray-400/50',
  Bronze: 'bg-orange-600/20 text-orange-300 border-orange-600/50',
};

export const UserStats = () => {
  const { address, isConnected } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isConnected || !address) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [address, isConnected]);

  if (!isConnected) {
    return null;
  }

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-48" />
      </Card>
    );
  }

  return (
    <Card className="p-6 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Ship className="w-5 h-5 text-accent" />
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
          Le Tue Statistiche
        </h3>
      </div>
      <div className="space-y-4">
        {/* Total Points */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Punti Totali</p>
              <p className="text-2xl font-bold">
                {profile?.total_points?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Current Tier */}
        <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20 hover:bg-secondary/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <Award className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Livello Attuale</p>
              <Badge
                variant="outline"
                className={`${tierColors[profile?.current_tier || 'Bronze']} mt-1`}
              >
                {profile?.current_tier || 'Bronze'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Wallet</p>
              <p className="font-mono text-sm font-semibold">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
