import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/hooks/useWallet";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Portfolio from "./pages/Portfolio";
import DeFiOpportunities from "./pages/DeFiOpportunities";
import Transparency from "./pages/Transparency";
import Deposit from "./pages/Deposit";
import Admin from "./pages/Admin";
import UserDetail from "./pages/UserDetail";
import Profile from "./pages/Profile";
import Activity from "./pages/Activity";
import Analytics from "./pages/Analytics";
import Withdraw from "./pages/Withdraw";
import Vaults from "./pages/Vaults";
import Referral from "./pages/Referral";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/portfolio" element={
                <ProtectedRoute>
                  <Portfolio />
                </ProtectedRoute>
              } />
              <Route path="/defi" element={
                <ProtectedRoute>
                  <DeFiOpportunities />
                </ProtectedRoute>
              } />
              <Route path="/transparency" element={<Transparency />} />
              <Route path="/deposit" element={
                <ProtectedRoute>
                  <Deposit />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              } />
              <Route path="/admin/user/:userId" element={
                <AdminRoute>
                  <UserDetail />
                </AdminRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/activity" element={
                <ProtectedRoute>
                  <Activity />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/withdraw" element={
                <ProtectedRoute>
                  <Withdraw />
                </ProtectedRoute>
              } />
              <Route path="/vaults" element={
                <ProtectedRoute>
                  <Vaults />
                </ProtectedRoute>
              } />
              <Route path="/referral" element={
                <ProtectedRoute>
                  <Referral />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
