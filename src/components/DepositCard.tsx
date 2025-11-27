import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConnectWallet } from '@web3-onboard/react';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowDownToLine, Loader2, AlertCircle, ExternalLink, Vault } from 'lucide-react';
import { BrowserProvider, parseEther, Contract } from 'ethers';

// SimpleVault ABI (only the functions we need)
const VAULT_ABI = [
  "function deposit() external payable",
  "function vaultName() external view returns (string)",
  "function baseAPY() external view returns (uint256)",
  "function pointsMultiplier() external view returns (uint256)"
];

interface Vault {
  id: string;
  name: string;
  protocol_type: string;
  base_apy: number;
  points_multiplier: number;
  contract_address: string;
  chain: string;
}

export const DepositCard = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<string>('');
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  
  // Get wallet info from Web3-Onboard
  const address = wallet?.accounts[0]?.address || null;
  const isConnected = !!wallet;
  const chainId = wallet?.chains[0]?.id;
  const chainType = chainId === '0x14a34' ? 'base-sepolia' : chainId === '0x2105' ? 'base' : 'unknown';
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const { toast } = useToast();

  // Fetch active vaults with contract addresses
  useEffect(() => {
    const fetchVaults = async () => {
      const { data, error } = await supabase
        .from('defi_strategies')
        .select('*')
        .eq('is_active', true)
        .not('contract_address', 'is', null)
        .order('name');

      if (error) {
        console.error('Error fetching vaults:', error);
        return;
      }

      setVaults(data || []);
      if (data && data.length > 0) {
        setSelectedVault(data[0].id);
      }
    };

    fetchVaults();
  }, []);

  const selectedVaultData = vaults.find(v => v.id === selectedVault);

  const handleDeposit = async () => {
    if (!isConnected || !address || !amount || !selectedVault) {
      toast({
        title: 'Error',
        description: 'Please connect wallet, select vault, and enter amount',
        variant: 'destructive',
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedVaultData?.contract_address) {
      toast({
        title: 'Error',
        description: 'Selected vault has no contract address',
        variant: 'destructive',
      });
      return;
    }

    // Support both Base Sepolia (testnet) and Base mainnet
    if (chainType !== 'base-sepolia' && chainType !== 'base') {
      toast({
        title: 'Unsupported Chain',
        description: 'Please switch to Base network in your wallet',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setTxStatus('Preparing transaction...');
    setTxHash('');

    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to continue',
          variant: 'destructive',
        });
        return;
      }

      // Get the provider from window.ethereum
      if (!window.ethereum) {
        throw new Error('No Web3 provider found. Please install MetaMask or use Trust Wallet.');
      }

      setTxStatus('Connecting to wallet...');
      
      // Create ethers provider and signer
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Verify the connected address matches
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Wallet address mismatch. Please reconnect your wallet.');
      }

      setTxStatus('Sending transaction to vault contract...');
      console.log('Depositing to vault:', {
        from: address,
        to: selectedVaultData.contract_address,
        value: parseEther(amount.toString()),
        vault: selectedVaultData.name,
      });

      // Create contract instance
      const vaultContract = new Contract(
        selectedVaultData.contract_address,
        VAULT_ABI,
        signer
      );

      // Call deposit function
      const tx = await vaultContract.deposit({
        value: parseEther(amount.toString())
      });

      console.log('Transaction sent:', tx.hash);
      setTxHash(tx.hash);
      setTxStatus('Waiting for confirmation...');

      toast({
        title: 'Transaction Sent',
        description: `Transaction hash: ${tx.hash.slice(0, 10)}...`,
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      console.log('Transaction confirmed:', receipt);
      setTxStatus('Saving to database...');

      // Calculate points earned
      const pointsEarned = depositAmount * 1000 * selectedVaultData.points_multiplier;

      // Insert position record
      const { error: dbError } = await supabase.from('user_defi_positions').insert({
        user_id: currentUser.id,
        strategy_id: selectedVault,
        amount: depositAmount,
        transaction_hash: tx.hash,
        chain: chainType,
        status: 'active',
      });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save position record');
      }

      toast({
        title: 'Deposit Successful! 🎉',
        description: `Deposited ${depositAmount} ETH to ${selectedVaultData.name}. You earned ${pointsEarned} points!`,
      });

      // Log deposit activity
      await logActivity('vault_deposit', `Deposited ${depositAmount} ETH to ${selectedVaultData.name}`, {
        amount: depositAmount,
        vault: selectedVaultData.name,
        chain: chainType,
        tx_hash: tx.hash,
        block_number: receipt.blockNumber,
        points_earned: pointsEarned,
      });

      setAmount('');
      setTxStatus('');
      
      // Reload the page to update stats
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error: any) {
      console.error('Deposit error:', error);
      
      let errorMessage = 'Failed to process deposit';
      
      if (error.code === 4001 || error.message?.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Deposit Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      setTxStatus('');
      setTxHash('');
    } finally {
      setLoading(false);
    }
  };

  const explorerUrl = chainType === 'base-sepolia' 
    ? 'https://sepolia.basescan.org' 
    : 'https://basescan.org';

  return (
    <Card className="p-6 border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <Vault className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Deposita nel Vault</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="vault" className="font-semibold">Seleziona Vault</Label>
          <Select value={selectedVault} onValueChange={setSelectedVault} disabled={loading || vaults.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={vaults.length === 0 ? "Nessun vault disponibile" : "Seleziona un vault"} />
            </SelectTrigger>
            <SelectContent>
              {vaults.map((vault) => (
                <SelectItem key={vault.id} value={vault.id}>
                  {vault.name} - {vault.base_apy}% APY ({vault.points_multiplier}x points)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedVaultData && (
            <p className="text-xs text-muted-foreground mt-1">
              Contract: {selectedVaultData.contract_address.slice(0, 6)}...{selectedVaultData.contract_address.slice(-4)}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="amount" className="font-semibold">Importo (ETH)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!isConnected || loading || !selectedVault}
            step="0.01"
            min="0"
          />
        </div>

        {selectedVaultData && amount && parseFloat(amount) > 0 && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Earn <span className="font-semibold text-foreground">
                {(parseFloat(amount) * 1000 * selectedVaultData.points_multiplier).toLocaleString()} points
              </span> ({selectedVaultData.points_multiplier}x multiplier)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Base APY: {selectedVaultData.base_apy}%
            </p>
          </div>
        )}

        {chainType !== 'base-sepolia' && chainType !== 'base' && isConnected && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Please switch to Base network in your wallet to deposit
            </p>
          </div>
        )}

        {txStatus && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {txStatus}
            </p>
          </div>
        )}

        {txHash && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400 mb-1">
              Transaction submitted!
            </p>
            <a
              href={`${explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
            >
              View on Basescan <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        <Button 
          onClick={handleDeposit} 
          disabled={!isConnected || loading || !amount || !selectedVault || (chainType !== 'base-sepolia' && chainType !== 'base')}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Processing...' : 'Deposit to Vault'}
        </Button>

        {!isConnected && (
          <p className="text-sm text-muted-foreground text-center">
            Connect your wallet to deposit
          </p>
        )}
      </div>
    </Card>
  );
};
