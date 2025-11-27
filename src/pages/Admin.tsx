import { AdminStats } from '@/components/admin/AdminStats';
import { VaultManagement } from '@/components/admin/VaultManagement';
import { UsersTable } from '@/components/admin/UsersTable';
import { AllDepositsTable } from '@/components/admin/AllDepositsTable';
import { AdminDefiPanel } from '@/components/admin/AdminDefiPanel';
import { usePageView } from '@/hooks/useActivityLogger';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Home, Shield, TrendingUp, Users, Wallet } from 'lucide-react';

const Admin = () => {
  // Log page view
  usePageView('Admin Dashboard');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage users, deposits, and platform metrics
              </p>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <AdminStats />
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="deposits" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Deposits
            </TabsTrigger>
            <TabsTrigger value="vaults" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Vaults
            </TabsTrigger>
            <TabsTrigger value="defi" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              DeFi Positions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTable />
          </TabsContent>

          <TabsContent value="deposits">
            <AllDepositsTable />
          </TabsContent>

          <TabsContent value="vaults">
            <VaultManagement />
          </TabsContent>

          <TabsContent value="defi">
            <AdminDefiPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
