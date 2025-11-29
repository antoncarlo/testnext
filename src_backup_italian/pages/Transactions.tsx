import DashboardLayout from '@/components/DashboardLayout';
import { TransactionHistory } from '@/components/TransactionHistory';
import { usePageView } from '@/hooks/useActivityLogger';

const Transactions = () => {
  // Log page view
  usePageView('Transactions');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header - Venetian Style */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-8 border border-primary/20">
          <div className="absolute inset-0 venetian-pattern opacity-20"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Cronologia Transazioni
            </h1>
            <p className="text-muted-foreground text-lg">
              Visualizza tutte le tue transazioni e operazioni sulla piattaforma
            </p>
          </div>
        </div>

        {/* Transaction History Component */}
        <TransactionHistory />
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
