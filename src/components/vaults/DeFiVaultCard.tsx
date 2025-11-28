import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DeFiVaultCard() {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">NextBlock DeFi Vault</CardTitle>
              <CardDescription>Yield Farming with Emergency Protection</CardDescription>
            </div>
          </div>
          <Badge variant="default" className="bg-green-500">
            Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">8.5%</div>
            <div className="text-xs text-muted-foreground">Base APY</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">2x</div>
            <div className="text-xs text-muted-foreground">Multiplier</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">2/3</div>
            <div className="text-xs text-muted-foreground">Multisig</div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span>Protected by Safe Multisig Treasury</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>Automated yield farming strategies</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span>Withdrawals always available</span>
          </div>
        </div>

        {/* Network */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Network</span>
          <Badge variant="outline">Base Sepolia</Badge>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Link to="/defivault" className="flex-1">
          <Button className="w-full" size="lg">
            Open Vault
          </Button>
        </Link>
        <a
          href="https://sepolia.basescan.org/address/0x360cD279d4Da74688ADA2B1274BE2AE3C0DA08e1"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="lg">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}
