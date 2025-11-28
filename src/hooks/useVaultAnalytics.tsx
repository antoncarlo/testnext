import { useCallback } from 'react';
import { useActivityLogger } from './useActivityLogger';

export interface VaultEvent {
  action: 'deposit' | 'withdraw' | 'view' | 'connect' | 'disconnect' | 'refresh' | 'error';
  amount?: string;
  txHash?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export function useVaultAnalytics() {
  const { logActivity } = useActivityLogger();

  const trackVaultEvent = useCallback(async (event: VaultEvent) => {
    const { action, amount, txHash, error, metadata } = event;

    // Log to activity logger (Supabase)
    try {
      await logActivity({
        action: `vault_${action}`,
        category: 'vault',
        details: {
          amount,
          txHash,
          error,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('Failed to log vault event:', err);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Vault Analytics]', {
        action,
        amount,
        txHash,
        error,
        metadata,
      });
    }

    // Send to external analytics (Google Analytics, Mixpanel, etc.)
    if (typeof window !== 'undefined') {
      // Google Analytics 4
      if ('gtag' in window) {
        (window as any).gtag('event', `vault_${action}`, {
          event_category: 'vault',
          event_label: action,
          value: amount ? parseFloat(amount) : undefined,
          transaction_id: txHash,
          ...metadata,
        });
      }

      // Mixpanel
      if ('mixpanel' in window) {
        (window as any).mixpanel?.track(`Vault ${action}`, {
          amount,
          txHash,
          error,
          ...metadata,
        });
      }

      // Custom analytics endpoint (optional)
      if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
        fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: `vault_${action}`,
            properties: {
              amount,
              txHash,
              error,
              ...metadata,
              timestamp: new Date().toISOString(),
            },
          }),
        }).catch(err => console.error('Failed to send analytics:', err));
      }
    }
  }, [logActivity]);

  // Specific tracking functions
  const trackDeposit = useCallback((amount: string, txHash?: string) => {
    return trackVaultEvent({
      action: 'deposit',
      amount,
      txHash,
      metadata: {
        amountEth: amount,
        network: 'base-sepolia',
      },
    });
  }, [trackVaultEvent]);

  const trackWithdraw = useCallback((amount: string, txHash?: string) => {
    return trackVaultEvent({
      action: 'withdraw',
      amount,
      txHash,
      metadata: {
        amountEth: amount,
        network: 'base-sepolia',
      },
    });
  }, [trackVaultEvent]);

  const trackView = useCallback(() => {
    return trackVaultEvent({
      action: 'view',
      metadata: {
        page: 'defivault',
      },
    });
  }, [trackVaultEvent]);

  const trackConnect = useCallback((walletType?: string) => {
    return trackVaultEvent({
      action: 'connect',
      metadata: {
        walletType,
      },
    });
  }, [trackVaultEvent]);

  const trackDisconnect = useCallback(() => {
    return trackVaultEvent({
      action: 'disconnect',
    });
  }, [trackVaultEvent]);

  const trackRefresh = useCallback(() => {
    return trackVaultEvent({
      action: 'refresh',
    });
  }, [trackVaultEvent]);

  const trackError = useCallback((error: string, context?: Record<string, any>) => {
    return trackVaultEvent({
      action: 'error',
      error,
      metadata: context,
    });
  }, [trackVaultEvent]);

  return {
    trackVaultEvent,
    trackDeposit,
    trackWithdraw,
    trackView,
    trackConnect,
    trackDisconnect,
    trackRefresh,
    trackError,
  };
}
