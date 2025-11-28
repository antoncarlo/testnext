import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';

export interface DefiStrategy {
  id: string;
  name: string;
  protocol_type: string;
  assets: string[];
  base_apy: number;
  points_multiplier: number;
  tvl: number;
  is_new: boolean;
  metadata: any;
}

export interface UserDefiPosition {
  id: string;
  amount: number;
  current_value: number;
  points_earned: number;
  status: string;
  created_at: string;
  strategy_id: string;
  tx_hash: string;
}

export const useUserDefiPositions = () => {
  const { user } = useAuth();
  const { address } = useWallet();
  const [positions, setPositions] = useState<UserDefiPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_deposited: 0,
    total_current_value: 0,
    total_points_earned: 0,
    active_positions_count: 0,
    total_yield: 0,
  });

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true);

        // Use wallet address if available, otherwise use user.id
        if (address) {
          // Use RPC function with wallet address
          const { data: positionsData, error: positionsError } = await supabase.rpc('get_user_positions', {
            p_wallet_address: address.toLowerCase()
          });

          if (positionsError) throw positionsError;
          
          // Filter only active positions
          const activePositions = (positionsData || []).filter((p: any) => p.status === 'active');
          setPositions(activePositions);

          // Calculate summary from positions
          const totalDeposited = activePositions.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
          const totalCurrentValue = activePositions.reduce((sum: number, p: any) => sum + Number(p.current_value), 0);
          const totalPointsEarned = activePositions.reduce((sum: number, p: any) => sum + Number(p.points_earned), 0);
          
          setSummary({
            total_deposited: totalDeposited,
            total_current_value: totalCurrentValue,
            total_points_earned: totalPointsEarned,
            active_positions_count: activePositions.length,
            total_yield: totalCurrentValue - totalDeposited,
          });
        } else if (user?.id) {
          // Fallback to direct query with user.id
          const { data: positionsData, error: positionsError } = await supabase
            .from('user_defi_positions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

          if (positionsError) throw positionsError;
          setPositions(positionsData || []);

          // Fetch summary
          const { data: summaryData, error: summaryError } = await supabase
            .rpc('get_user_defi_summary', { p_user_id: user.id });

          if (summaryError) {
            console.error('Error fetching summary:', summaryError);
          } else if (summaryData && summaryData.length > 0) {
            setSummary({
              total_deposited: Number(summaryData[0].total_deposited),
              total_current_value: Number(summaryData[0].total_current_value),
              total_points_earned: Number(summaryData[0].total_points_earned),
              active_positions_count: Number(summaryData[0].active_positions_count),
              total_yield: Number(summaryData[0].total_yield),
            });
          }
        }
      } catch (error) {
        console.error('Error fetching DeFi positions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user || address) {
      fetchPositions();

      // Set up real-time subscription for position updates
      const channel = supabase
        .channel('user_defi_positions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_defi_positions',
          },
          () => {
            // Refetch positions when changes occur
            fetchPositions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [user, address]);

  return { positions, loading, summary };
};
