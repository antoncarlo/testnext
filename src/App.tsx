/**
 * Main Application Component with Web3-Onboard Integration
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 */

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3OnboardProvider } from '@web3-onboard/react';
import { web3Onboard } from '@/config/web3-onboard';
import { AuthProvider } from "@/hooks/useAuth";
import { WalletProvider } from "@/contexts/WalletContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { AdminRoute } from "@/components/AdminRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2 } from "lucide-react";

// Eager load critical pages (Home, Auth)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load all other pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const DeFiOpportunities = lazy(() => import("./pages/DeFiOpportunities"));
const Transparency = lazy(() => import("./pages/Transparency"));
const Deposit = lazy(() => import("./pages/Deposit"));
const Admin = lazy(() => import("./pages/Admin"));
const UserDetail = lazy(() => import("./pages/UserDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Activity = lazy(() => import("./pages/Activity"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Withdraw = lazy(() => import("./pages/Withdraw"));
const Vaults = lazy(() => import("./pages/Vaults"));
const Referral = lazy(() => import("./pages/Referral"));
const Transactions = lazy(() => import("./pages/Transactions"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component with Venetian style
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
        Caricamento...
      </p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <AuthProvider>
        <WalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes - eager loaded */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Protected routes - lazy loaded */}
                  <Route path="/dashboard" element={
                    <ProtectedLayout>
                      <Dashboard />
                    </ProtectedLayout>
                  } />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/portfolio" element={
                    <ProtectedLayout>
                      <Portfolio />
                    </ProtectedLayout>
                  } />
                  <Route path="/defi" element={
                    <ProtectedLayout>
                      <DeFiOpportunities />
                    </ProtectedLayout>
                  } />
                  <Route path="/transparency" element={<Transparency />} />
                  <Route path="/deposit" element={
                    <ProtectedLayout>
                      <Deposit />
                    </ProtectedLayout>
                  } />
                  <Route path="/withdraw" element={
                    <ProtectedLayout>
                      <Withdraw />
                    </ProtectedLayout>
                  } />
                  <Route path="/vaults" element={
                    <ProtectedLayout>
                      <Vaults />
                    </ProtectedLayout>
                  } />
                  <Route path="/referral" element={
                    <ProtectedLayout>
                      <Referral />
                    </ProtectedLayout>
                  } />
                  <Route path="/transactions" element={
                    <ProtectedLayout>
                      <Transactions />
                    </ProtectedLayout>
                  } />
                  <Route path="/profile" element={
                    <ProtectedLayout>
                      <Profile />
                    </ProtectedLayout>
                  } />
                  <Route path="/activity" element={
                    <ProtectedLayout>
                      <Activity />
                    </ProtectedLayout>
                  } />
                  <Route path="/analytics" element={
                    <ProtectedLayout>
                      <Analytics />
                    </ProtectedLayout>
                  } />
                  
                  {/* Admin routes - lazy loaded */}
                  <Route path="/admin" element={
                    <AdminRoute>
                      <DashboardLayout>
                        <Admin />
                      </DashboardLayout>
                    </AdminRoute>
                  } />
                  <Route path="/admin/user/:userId" element={
                    <AdminRoute>
                      <DashboardLayout>
                        <UserDetail />
                      </DashboardLayout>
                    </AdminRoute>
                  } />
                  
                  {/* 404 - lazy loaded */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </WalletProvider>
      </AuthProvider>
    </Web3OnboardProvider>
  </QueryClientProvider>
);

export default App;
