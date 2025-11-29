/**
 * Vault Interaction Component
 * Handles deposit and withdraw operations for DeFiVault
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Shield, ExternalLink, AlertTriangle } from 'lucide-react';
import { useVaultContract, formatVaultBalance, formatAPY } from '@/hooks/useVaultContract';
import { useToast } from '@/hooks/use-toast';

export function VaultInteraction() {
  const { vaultData, isLoading, error, deposit, withdraw, refresh, isConnected, wrongNetwork, switchToBaseSepolia } = useVaultContract();
  const { toast } = useToast();
  
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsDepositing(true);
      const txHash = await deposit(depositAmount);
      
      toast({
        title: 'Deposit Successful!',
        description: `Deposited ${depositAmount} ETH`,
      });
      
      setDepositAmount('');
    } catch (err: any) {
      toast({
        title: 'Deposit Failed',
        description: err.message || 'Transaction failed',
        variant: 'destructive',
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount',
        variant: 'destructive',
      });
      return;
    }

    if (vaultData && BigInt(parseFloat(withdrawAmount) * 1e18) > vaultData.userBalance) {
      toast({
        title: 'Insufficient Balance',
        description: 'You don\'t have enough balance to withdraw this amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsWithdrawing(true);
      const txHash = await withdraw(withdrawAmount);
      
      toast({
        title: 'Withdrawal Successful!',
        description: `Withdrawn ${withdrawAmount} ETH`,
      });
      
      setWithdrawAmount('');
    } catch (err: any) {
      toast({
        title: 'Withdrawal Failed',
        description: err.message || 'Transaction failed',
        variant: 'destructive',
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Removed isConnected check - now shows vault data even without wallet

  if (isLoading && !vaultData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Vault</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
          <Button onClick={refresh} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!vaultData) return null;

  return (
    <div className="space-y-6">
      {/* Vault Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {vaultData.vaultName}
              </CardTitle>
              <CardDescription className="capitalize">{vaultData.protocolType}</CardDescription>
            </div>
            {vaultData.emergencyMode && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Emergency Mode
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-primary/5">
              <div className="text-sm text-muted-foreground mb-1">APY</div>
              <div className="text-2xl font-bold text-primary">
                {formatAPY(vaultData.baseAPY)}%
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-secondary/5">
              <div className="text-sm text-muted-foreground mb-1">Multiplier</div>
              <div className="text-2xl font-bold">
                {vaultData.pointsMultiplier.toString()}x
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-primary/5">
              <div className="text-sm text-muted-foreground mb-1">Your Balance</div>
              <div className="text-2xl font-bold">
                {formatVaultBalance(vaultData.userBalance)} ETH
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-secondary/5">
              <div className="text-sm text-muted-foreground mb-1">TVL</div>
              <div className="text-2xl font-bold">
                {formatVaultBalance(vaultData.totalValueLocked)} ETH
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://sepolia.basescan.org/address/${vaultData.treasury}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Treasury
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://app.safe.global/home?safe=basesep:' + vaultData.treasury, '_blank')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Safe Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deposit/Withdraw Card */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit & Withdraw</CardTitle>
          <CardDescription>
            Manage your vault position
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConnected && (
            <Alert>
              <AlertDescription>
                Connect your wallet to deposit or withdraw funds.
              </AlertDescription>
            </Alert>
          )}
          
          {isConnected && wrongNetwork && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>You are connected to the wrong network. Please switch to Base Sepolia.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchToBaseSepolia}
                  className="ml-4"
                >
                  Switch Network
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {vaultData.emergencyMode && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Emergency mode is active. Deposits are disabled, but you can still withdraw your funds.
              </AlertDescription>
            </Alert>
          )}

          {/* Deposit Section */}
          <div className="space-y-3">
            <h3 className="font-semibold">Deposit ETH</h3>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={vaultData.emergencyMode || isDepositing}
                step="0.001"
                min="0"
              />
              <Button
                onClick={handleDeposit}
                disabled={!isConnected || wrongNetwork || vaultData.emergencyMode || isDepositing || !depositAmount}
                className="min-w-[120px]"
              >
                {isDepositing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  'Deposit'
                )}
              </Button>
            </div>
          </div>

          {/* Withdraw Section */}
          <div className="space-y-3">
            <h3 className="font-semibold">Withdraw ETH</h3>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={isWithdrawing}
                step="0.001"
                min="0"
                max={formatVaultBalance(vaultData.userBalance)}
              />
              <Button
                onClick={handleWithdraw}
                disabled={!isConnected || wrongNetwork || isWithdrawing || !withdrawAmount || vaultData.userBalance === BigInt(0)}
                variant="outline"
                className="min-w-[120px]"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  'Withdraw'
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWithdrawAmount(formatVaultBalance(vaultData.userBalance))}
              disabled={vaultData.userBalance === BigInt(0)}
            >
              Max: {formatVaultBalance(vaultData.userBalance)} ETH
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
