/**
 * Protected Layout Component
 * Combines ProtectedRoute with DashboardLayout for persistent sidebar
 */

import { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import DashboardLayout from "./DashboardLayout";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
};
