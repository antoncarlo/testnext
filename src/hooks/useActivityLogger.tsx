import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useActivityLogger = () => {
  const { user } = useAuth();

  const logActivity = async (
    activityType: string,
    description?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await supabase.from('user_activity').insert({
        user_id: user.id,
        activity_type: activityType,
        description,
        metadata: metadata || null,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  return { logActivity };
};

// Hook per tracciare automaticamente le visualizzazioni di pagina
export const usePageView = (pageName: string) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const logPageView = async () => {
      try {
        await supabase.from('user_activity').insert({
          user_id: user.id,
          activity_type: 'page_view',
          description: `Viewed ${pageName}`,
          metadata: {
            page: pageName,
            timestamp: new Date().toISOString(),
            url: window.location.pathname,
          },
        });
      } catch (error) {
        console.error('Failed to log page view:', error);
      }
    };

    logPageView();
  }, [user, pageName]);
};
