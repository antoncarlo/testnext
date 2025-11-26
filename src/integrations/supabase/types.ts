export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      defi_strategies: {
        Row: {
          assets: string[]
          base_apy: number
          chain: string
          contract_address: string | null
          created_at: string
          id: string
          is_active: boolean
          is_new: boolean
          metadata: Json | null
          name: string
          points_multiplier: number
          protocol_type: string
          tvl: number
          updated_at: string
        }
        Insert: {
          assets: string[]
          base_apy?: number
          chain?: string
          contract_address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_new?: boolean
          metadata?: Json | null
          name: string
          points_multiplier?: number
          protocol_type: string
          tvl?: number
          updated_at?: string
        }
        Update: {
          assets?: string[]
          base_apy?: number
          chain?: string
          contract_address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_new?: boolean
          metadata?: Json | null
          name?: string
          points_multiplier?: number
          protocol_type?: string
          tvl?: number
          updated_at?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          chain: string
          confirmed_at: string | null
          created_at: string
          id: string
          points_awarded: number | null
          status: string
          tx_hash: string
          user_id: string
        }
        Insert: {
          amount: number
          chain: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number | null
          status?: string
          tx_hash: string
          user_id: string
        }
        Update: {
          amount?: number
          chain?: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number | null
          status?: string
          tx_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_history: {
        Row: {
          action_type: string
          created_at: string
          deposit_id: string | null
          description: string | null
          id: string
          points: number
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          deposit_id?: string | null
          description?: string | null
          id?: string
          points: number
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          deposit_id?: string | null
          description?: string | null
          id?: string
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_history_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: false
            referencedRelation: "deposits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          current_tier: string | null
          email: string | null
          id: string
          referral_code: string | null
          referred_by: string | null
          total_points: number | null
          updated_at: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          current_tier?: string | null
          email?: string | null
          id: string
          referral_code?: string | null
          referred_by?: string | null
          total_points?: number | null
          updated_at?: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          current_tier?: string | null
          email?: string | null
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          total_points?: number | null
          updated_at?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["referral_code"]
          },
        ]
      }
      referrals: {
        Row: {
          activated_at: string | null
          created_at: string | null
          id: string
          referee_first_deposit_amount: number | null
          referee_id: string
          referee_points_earned: number | null
          referral_code: string
          referrer_id: string
          referrer_points_earned: number | null
          status: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          id?: string
          referee_first_deposit_amount?: number | null
          referee_id: string
          referee_points_earned?: number | null
          referral_code: string
          referrer_id: string
          referrer_points_earned?: number | null
          status?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          id?: string
          referee_first_deposit_amount?: number | null
          referee_id?: string
          referee_points_earned?: number | null
          referral_code?: string
          referrer_id?: string
          referrer_points_earned?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_defi_positions: {
        Row: {
          amount: number
          auto_compound: boolean | null
          compound_frequency: string | null
          created_at: string
          current_value: number
          early_withdrawal_penalty_percent: number | null
          entry_price: number
          id: string
          last_compound_at: string | null
          min_lock_days: number | null
          points_earned: number
          status: string
          strategy_id: string
          tx_hash: string | null
          updated_at: string
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          amount: number
          auto_compound?: boolean | null
          compound_frequency?: string | null
          created_at?: string
          current_value?: number
          early_withdrawal_penalty_percent?: number | null
          entry_price: number
          id?: string
          last_compound_at?: string | null
          min_lock_days?: number | null
          points_earned?: number
          status?: string
          strategy_id: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          amount?: number
          auto_compound?: boolean | null
          compound_frequency?: string | null
          created_at?: string
          current_value?: number
          early_withdrawal_penalty_percent?: number | null
          entry_price?: number
          id?: string
          last_compound_at?: string | null
          min_lock_days?: number | null
          points_earned?: number
          status?: string
          strategy_id?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_defi_positions_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "defi_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          current_tier: string | null
          id: string | null
          rank: number | null
          total_deposited: number | null
          total_deposits: number | null
          total_points: number | null
          wallet_address: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_tier: { Args: { p_points: number }; Returns: string }
      calculate_withdrawal_amount: {
        Args: { p_position_id: string }
        Returns: {
          days_locked: number
          min_days_required: number
          penalty_amount: number
          penalty_applied: boolean
          principal: number
          total_amount: number
          yield_earned: number
        }[]
      }
      generate_referral_code: { Args: never; Returns: string }
      get_user_defi_summary: {
        Args: { p_user_id: string }
        Returns: {
          active_positions_count: number
          total_current_value: number
          total_deposited: number
          total_points_earned: number
          total_yield: number
        }[]
      }
      handle_referral_signup: {
        Args: { p_referee_id: string; p_referral_code: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_user_activity: {
        Args: {
          p_activity_type: string
          p_description?: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      process_referral_bonus: {
        Args: { p_deposit_amount: number; p_referee_id: string }
        Returns: undefined
      }
      refresh_leaderboard: { Args: never; Returns: undefined }
      update_user_points: {
        Args: {
          p_action_type: string
          p_deposit_id?: string
          p_description?: string
          p_points: number
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
