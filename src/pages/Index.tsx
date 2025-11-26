import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Wallet, TrendingUp, LogIn } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-8 px-4">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            NextBlock Re
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Cross-chain DeFi platform on Base and Solana with CCTP integration
          </p>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Deposit crypto, earn points, and climb the leaderboard
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link to="/auth">
            <Button size="lg" className="gap-2 min-w-[180px]">
              <LogIn className="h-5 w-5" />
              Sign In / Sign Up
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="secondary" className="gap-2 min-w-[180px]">
              <Wallet className="h-5 w-5" />
              Launch App
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button size="lg" variant="outline" className="gap-2 min-w-[180px]">
              <Trophy className="h-5 w-5" />
              Leaderboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-12">
          <div className="p-6 rounded-lg border bg-card">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Multi-Chain Support</h3>
            <p className="text-sm text-muted-foreground">
              Connect MetaMask for Base or Phantom for Solana
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">Earn Points</h3>
            <p className="text-sm text-muted-foreground">
              Get 1000 points per ETH deposited and climb tiers
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Compete</h3>
            <p className="text-sm text-muted-foreground">
              Reach Diamond tier and top the leaderboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
