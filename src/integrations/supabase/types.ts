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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      campaign_enrollments: {
        Row: {
          campaign_type: string
          created_at: string
          delivery_address: string
          id: string
          name: string
          platform: string
          status: string
          tracking_order_id: string
          user_id: string
        }
        Insert: {
          campaign_type: string
          created_at?: string
          delivery_address: string
          id?: string
          name: string
          platform: string
          status?: string
          tracking_order_id: string
          user_id?: string
        }
        Update: {
          campaign_type?: string
          created_at?: string
          delivery_address?: string
          id?: string
          name?: string
          platform?: string
          status?: string
          tracking_order_id?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          campaign_link: string
          created_at: string
          created_by: string | null
          id: string
          incentive_amount: number
          is_active: boolean
          name: string
          platform: string
          updated_at: string
        }
        Insert: {
          campaign_link: string
          created_at?: string
          created_by?: string | null
          id?: string
          incentive_amount: number
          is_active?: boolean
          name: string
          platform: string
          updated_at?: string
        }
        Update: {
          campaign_link?: string
          created_at?: string
          created_by?: string | null
          id?: string
          incentive_amount?: number
          is_active?: boolean
          name?: string
          platform?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_status: string
          created_at: string
          device_fingerprint: string | null
          display_name: string | null
          email: string
          id: string
          mobile_number: string | null
          onboarding_complete: boolean
          role: string
          sign_up_ip: unknown
          updated_at: string
        }
        Insert: {
          access_status?: string
          created_at?: string
          device_fingerprint?: string | null
          display_name?: string | null
          email: string
          id: string
          mobile_number?: string | null
          onboarding_complete?: boolean
          role?: string
          sign_up_ip?: unknown
          updated_at?: string
        }
        Update: {
          access_status?: string
          created_at?: string
          device_fingerprint?: string | null
          display_name?: string | null
          email?: string
          id?: string
          mobile_number?: string | null
          onboarding_complete?: boolean
          role?: string
          sign_up_ip?: unknown
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          campaign_type: string
          created_at: string
          enrollment_id: string | null
          id: string
          name: string
          platform: string
          proof_filename: string | null
          status: string
          upi_id: string
          user_id: string
        }
        Insert: {
          campaign_type: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          name: string
          platform: string
          proof_filename?: string | null
          status?: string
          upi_id: string
          user_id?: string
        }
        Update: {
          campaign_type?: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          name?: string
          platform?: string
          proof_filename?: string | null
          status?: string
          upi_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "campaign_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      task_verifications: {
        Row: {
          created_at: string
          enrollment_id: string | null
          id: string
          media_path: string
          status: string
          upi_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enrollment_id?: string | null
          id?: string
          media_path: string
          status?: string
          upi_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string | null
          id?: string
          media_path?: string
          status?: string
          upi_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_verifications_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "campaign_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_partner_onboarding: {
        Args: {
          p_device_fingerprint?: string
          p_display_name: string
          p_mobile_number: string
          p_sign_up_ip?: unknown
        }
        Returns: {
          access_status: string
          created_at: string
          device_fingerprint: string | null
          display_name: string | null
          email: string
          id: string
          mobile_number: string | null
          onboarding_complete: boolean
          role: string
          sign_up_ip: unknown
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_super_admin: { Args: { _uid: string }; Returns: boolean }
      list_admin_profiles: {
        Args: never
        Returns: {
          access_status: string
          created_at: string
          device_fingerprint: string | null
          display_name: string | null
          email: string
          id: string
          mobile_number: string | null
          onboarding_complete: boolean
          role: string
          sign_up_ip: unknown
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      save_campaign: {
        Args: {
          p_campaign_id?: string
          p_incentive: number
          p_link: string
          p_name: string
          p_platform: string
        }
        Returns: {
          campaign_link: string
          created_at: string
          created_by: string | null
          id: string
          incentive_amount: number
          is_active: boolean
          name: string
          platform: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "campaigns"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_user_access_status: {
        Args: { p_status: string; p_user_id: string }
        Returns: undefined
      }
      toggle_campaign_active: {
        Args: { p_campaign_id: string; p_is_active: boolean }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
