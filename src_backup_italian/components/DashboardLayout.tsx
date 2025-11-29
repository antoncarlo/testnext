import { Button } from "@/components/ui/button";
import { useWalletVenetian } from "@/contexts/WalletContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/config/supabase";
import { 
  LayoutDashboard, 
  Vault, 
  User, 
  LogOut, 
  Menu,
  X,
  Coins,
  TrendingUp,
  History,
  Shield,
  Activity,
  ArrowDownToLine,
  Gift,
  Trophy,
  BarChart3
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo, memo } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = memo(function DashboardLayout({ children }: DashboardLayoutProps) {
  const { address, balance, disconnectWallet } = useWalletVenetian();
  const { isAdmin } = useAdminCheck();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation items - memoized for performance
  const navigation = useMemo(() => [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Vault", href: "/vaults", icon: Vault },
    { name: "Portafoglio", href: "/portfolio", icon: TrendingUp },
    { name: "Transazioni", href: "/transactions", icon: History },
    { name: "Preleva", href: "/withdraw", icon: ArrowDownToLine },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Attività", href: "/activity", icon: Activity },
    { name: "Referral", href: "/referral", icon: Gift },
    { name: "Classifica", href: "/leaderboard", icon: Trophy },
    { name: "Profilo", href: "/profile", icon: User },
  ], []);

  // Add Admin link if user is admin - memoized
  const adminNavigation = useMemo(() => isAdmin ? [    { name: "Admin", href: "/admin", icon: Shield },
  ] : [], [isAdmin]);

  const allNavigation = [...adminNavigation, ...navigation];

  const handleDisconnect = async () => {
    // Disconnect wallet
    disconnectWallet();
    // Sign out from Supabase
    await supabase.auth.signOut();
    // Navigate to home
    navigate("/");
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-accent" />
              <span className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                NEXTBLOCK
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {allNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info & disconnect */}
          <div className="p-4 border-t border-border">
            {address && (
              <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Wallet Connesso</p>
                <p className="text-sm font-mono font-semibold">
                  {formatAddress(address)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Saldo NXB</p>
                <p className="text-lg font-bold text-accent">
                  {balance.toFixed(2)}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDisconnect}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnetti
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex-1 lg:flex-none">
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                {allNavigation.find((item) => item.href === location.pathname)?.name || "Dashboard"}
              </h1>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              {address && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Wallet</p>
                  <p className="text-sm font-mono font-semibold">
                    {formatAddress(address)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
});

export default DashboardLayout;
