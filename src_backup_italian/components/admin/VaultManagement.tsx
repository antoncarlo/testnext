import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, TrendingUp, Loader2 } from 'lucide-react';

interface Vault {
  id: string;
  name: string;
  protocol_type: string;
  assets: string[];
  base_apy: number;
  points_multiplier: number;
  tvl: number;
  is_active: boolean;
  is_new: boolean;
  contract_address: string | null;
  chain: string;
  created_at: string;
}

export function VaultManagement() {
  const { toast } = useToast();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVault, setEditingVault] = useState<Vault | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    protocol_type: 'lending',
    assets: '',
    base_apy: '',
    points_multiplier: '1',
    tvl: '0',
    is_active: true,
    is_new: false,
    contract_address: '',
    chain: 'base',
  });

  useEffect(() => {
    fetchVaults();
  }, []);

  const fetchVaults = async () => {
    try {
      const { data, error } = await supabase
        .from('defi_strategies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVaults(data || []);
    } catch (error: any) {
      console.error('Error fetching vaults:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch vaults',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const vaultData = {
        name: formData.name,
        protocol_type: formData.protocol_type,
        assets: formData.assets.split(',').map(a => a.trim()),
        base_apy: parseFloat(formData.base_apy),
        points_multiplier: parseFloat(formData.points_multiplier),
        tvl: parseFloat(formData.tvl),
        is_active: formData.is_active,
        is_new: formData.is_new,
        contract_address: formData.contract_address || null,
        chain: formData.chain,
      };

      if (editingVault) {
        // Update existing vault
        const { error } = await supabase
          .from('defi_strategies')
          .update(vaultData)
          .eq('id', editingVault.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Vault updated successfully',
        });
      } else {
        // Create new vault
        const { error } = await supabase
          .from('defi_strategies')
          .insert([vaultData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Vault created successfully',
        });
      }

      setDialogOpen(false);
      setEditingVault(null);
      resetForm();
      fetchVaults();
    } catch (error: any) {
      console.error('Error saving vault:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save vault',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (vault: Vault) => {
    setEditingVault(vault);
    setFormData({
      name: vault.name,
      protocol_type: vault.protocol_type,
      assets: vault.assets.join(', '),
      base_apy: vault.base_apy.toString(),
      points_multiplier: vault.points_multiplier.toString(),
      tvl: vault.tvl.toString(),
      is_active: vault.is_active,
      is_new: vault.is_new,
      contract_address: vault.contract_address || '',
      chain: vault.chain,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vault?')) return;

    try {
      const { error } = await supabase
        .from('defi_strategies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Vault deleted successfully',
      });

      fetchVaults();
    } catch (error: any) {
      console.error('Error deleting vault:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete vault',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (vault: Vault) => {
    try {
      const { error } = await supabase
        .from('defi_strategies')
        .update({ is_active: !vault.is_active })
        .eq('id', vault.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Vault ${!vault.is_active ? 'activated' : 'deactivated'}`,
      });

      fetchVaults();
    } catch (error: any) {
      console.error('Error toggling vault:', error);
      toast({
        title: 'Error',
        description: 'Failed to update vault status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      protocol_type: 'lending',
      assets: '',
      base_apy: '',
      points_multiplier: '1',
      tvl: '0',
      is_active: true,
      is_new: false,
      contract_address: '',
      chain: 'base',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vault Management</CardTitle>
            <CardDescription>
              Create and manage DeFi vaults and strategies
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingVault(null); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Vault
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVault ? 'Edit Vault' : 'Create New Vault'}
                </DialogTitle>
                <DialogDescription>
                  {editingVault
                    ? 'Update vault details and configuration'
                    : 'Add a new DeFi vault or strategy to the platform'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Vault Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., USDC Lending Pool"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protocol_type">Protocol Type *</Label>
                    <Select
                      value={formData.protocol_type}
                      onValueChange={(value) => setFormData({ ...formData, protocol_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lending">Lending</SelectItem>
                        <SelectItem value="staking">Staking</SelectItem>
                        <SelectItem value="liquidity">Liquidity Pool</SelectItem>
                        <SelectItem value="yield">Yield Farming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assets">Assets (comma-separated) *</Label>
                  <Input
                    id="assets"
                    value={formData.assets}
                    onChange={(e) => setFormData({ ...formData, assets: e.target.value })}
                    placeholder="e.g., USDC, ETH"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_apy">Base APY (%) *</Label>
                    <Input
                      id="base_apy"
                      type="number"
                      step="0.01"
                      value={formData.base_apy}
                      onChange={(e) => setFormData({ ...formData, base_apy: e.target.value })}
                      placeholder="5.5"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points_multiplier">Points Multiplier *</Label>
                    <Input
                      id="points_multiplier"
                      type="number"
                      step="0.1"
                      value={formData.points_multiplier}
                      onChange={(e) => setFormData({ ...formData, points_multiplier: e.target.value })}
                      placeholder="1.0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tvl">TVL (USD)</Label>
                    <Input
                      id="tvl"
                      type="number"
                      step="0.01"
                      value={formData.tvl}
                      onChange={(e) => setFormData({ ...formData, tvl: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contract_address">Contract Address</Label>
                    <Input
                      id="contract_address"
                      value={formData.contract_address}
                      onChange={(e) => setFormData({ ...formData, contract_address: e.target.value })}
                      placeholder="0x..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chain">Chain *</Label>
                    <Select
                      value={formData.chain}
                      onValueChange={(value) => setFormData({ ...formData, chain: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="base">Base</SelectItem>
                        <SelectItem value="solana">Solana</SelectItem>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_new"
                      checked={formData.is_new}
                      onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="is_new" className="cursor-pointer">Mark as New</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingVault ? 'Update Vault' : 'Create Vault'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>APY</TableHead>
              <TableHead>Multiplier</TableHead>
              <TableHead>TVL</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vaults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No vaults found. Create your first vault to get started.
                </TableCell>
              </TableRow>
            ) : (
              vaults.map((vault) => (
                <TableRow key={vault.id}>
                  <TableCell className="font-medium">
                    {vault.name}
                    {vault.is_new && (
                      <Badge variant="secondary" className="ml-2">NEW</Badge>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{vault.protocol_type}</TableCell>
                  <TableCell>{vault.assets.join(', ')}</TableCell>
                  <TableCell>{vault.base_apy.toFixed(2)}%</TableCell>
                  <TableCell>{vault.points_multiplier}x</TableCell>
                  <TableCell>${vault.tvl.toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{vault.chain}</TableCell>
                  <TableCell>
                    <Badge variant={vault.is_active ? 'default' : 'secondary'}>
                      {vault.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(vault)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive(vault)}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(vault.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
