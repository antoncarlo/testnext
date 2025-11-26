import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePageView } from '@/hooks/useActivityLogger';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Home, LayoutDashboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface LeaderboardEntry {
  rank: number;
  id: string;
  wallet_address: string;
  total_points: number;
  current_tier: string;
}

const tierColors: Record<string, string> = {
  Diamond: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
  Platinum: "bg-slate-400/20 text-slate-300 border-slate-400/50",
  Gold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
  Silver: "bg-gray-400/20 text-gray-300 border-gray-400/50",
  Bronze: "bg-orange-600/20 text-orange-300 border-orange-600/50",
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-slate-400" />;
  if (rank === 3) return <Award className="h-6 w-6 text-orange-600" />;
  return <span className="text-2xl font-bold text-muted-foreground">{rank}</span>;
};

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Log page view
  usePageView('Leaderboard');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase.rpc("get_leaderboard" as any);

        if (error) throw error;

        setLeaderboard(data || []);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        toast({
          title: "Error",
          description: "Failed to load leaderboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [toast]);

  const formatPoints = (points: number) => {
    return new Intl.NumberFormat("en-US").format(points);
  };

  const shortenAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <div className="flex gap-2">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Top users ranked by total points
          </p>
        </div>

        {/* Leaderboard List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-xl text-muted-foreground">
              No rankings yet. Be the first to earn points!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <Card
                key={entry.id}
                className={`p-4 transition-all hover:scale-[1.01] ${
                  entry.rank <= 3 ? "border-primary/30 shadow-lg" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm truncate">
                        {shortenAddress(entry.wallet_address)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={tierColors[entry.current_tier] || tierColors.Bronze}
                      >
                        {entry.current_tier}
                      </Badge>
                      <span className="text-2xl font-bold">
                        {formatPoints(entry.total_points)}
                        <span className="text-sm text-muted-foreground ml-1">pts</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
