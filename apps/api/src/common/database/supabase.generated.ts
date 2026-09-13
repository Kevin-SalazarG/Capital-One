export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          id: string;
          metadata: Json;
          organization_id: string | null;
          request_id: string | null;
          resource_id: string | null;
          resource_type: string;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string | null;
          request_id?: string | null;
          resource_id?: string | null;
          resource_type: string;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string | null;
          request_id?: string | null;
          resource_id?: string | null;
          resource_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      bank_accounts: {
        Row: {
          available_balance: number | null;
          balance: number;
          connection_id: string;
          created_at: string;
          currency: string;
          external_id: string;
          id: string;
          last_synced_at: string | null;
          metadata: Json;
          name: string;
          organization_id: string;
          status: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          available_balance?: number | null;
          balance: number;
          connection_id: string;
          created_at?: string;
          currency?: string;
          external_id: string;
          id?: string;
          last_synced_at?: string | null;
          metadata?: Json;
          name: string;
          organization_id: string;
          status?: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          available_balance?: number | null;
          balance?: number;
          connection_id?: string;
          created_at?: string;
          currency?: string;
          external_id?: string;
          id?: string;
          last_synced_at?: string | null;
          metadata?: Json;
          name?: string;
          organization_id?: string;
          status?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bank_accounts_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "data_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bank_accounts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      bank_transactions: {
        Row: {
          amount: number;
          bank_account_id: string;
          category: string | null;
          connection_id: string;
          created_at: string;
          currency: string;
          description: string | null;
          direction: string;
          external_id: string;
          id: string;
          metadata: Json;
          organization_id: string;
          posted_at: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          bank_account_id: string;
          category?: string | null;
          connection_id: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          direction: string;
          external_id: string;
          id?: string;
          metadata?: Json;
          organization_id: string;
          posted_at: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          bank_account_id?: string;
          category?: string | null;
          connection_id?: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          direction?: string;
          external_id?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          posted_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey";
            columns: ["bank_account_id"];
            isOneToOne: false;
            referencedRelation: "bank_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bank_transactions_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "data_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bank_transactions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      cfdi_import_batches: {
        Row: {
          id: string;
          imported_at: string;
          imported_by: string;
          organization_id: string;
          records_created: number;
          records_read: number;
          records_updated: number;
          source_hash: string;
          source_name: string;
          source_object_path: string | null;
        };
        Insert: {
          id?: string;
          imported_at?: string;
          imported_by: string;
          organization_id: string;
          records_created?: number;
          records_read?: number;
          records_updated?: number;
          source_hash: string;
          source_name: string;
          source_object_path?: string | null;
        };
        Update: {
          id?: string;
          imported_at?: string;
          imported_by?: string;
          organization_id?: string;
          records_created?: number;
          records_read?: number;
          records_updated?: number;
          source_hash?: string;
          source_name?: string;
          source_object_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cfdi_import_batches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      cfdi_invoices: {
        Row: {
          cfdi_uuid: string;
          counterparty_name: string | null;
          created_at: string;
          currency: string;
          direction: string;
          due_on: string | null;
          expected_collection_probability: number | null;
          id: string;
          import_batch_id: string | null;
          issued_at: string;
          issuer_rfc: string;
          metadata: Json;
          organization_id: string;
          outstanding_amount: number;
          payment_status: string;
          receiver_rfc: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          cfdi_uuid: string;
          counterparty_name?: string | null;
          created_at?: string;
          currency?: string;
          direction: string;
          due_on?: string | null;
          expected_collection_probability?: number | null;
          id?: string;
          import_batch_id?: string | null;
          issued_at: string;
          issuer_rfc: string;
          metadata?: Json;
          organization_id: string;
          outstanding_amount: number;
          payment_status: string;
          receiver_rfc: string;
          total_amount: number;
          updated_at?: string;
        };
        Update: {
          cfdi_uuid?: string;
          counterparty_name?: string | null;
          created_at?: string;
          currency?: string;
          direction?: string;
          due_on?: string | null;
          expected_collection_probability?: number | null;
          id?: string;
          import_batch_id?: string | null;
          issued_at?: string;
          issuer_rfc?: string;
          metadata?: Json;
          organization_id?: string;
          outstanding_amount?: number;
          payment_status?: string;
          receiver_rfc?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cfdi_invoices_import_batch_id_fkey";
            columns: ["import_batch_id"];
            isOneToOne: false;
            referencedRelation: "cfdi_import_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cfdi_invoices_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      data_connections: {
        Row: {
          created_at: string;
          created_by: string;
          credential_ref: string | null;
          display_name: string;
          external_customer_id: string | null;
          id: string;
          kind: string;
          last_error_code: string | null;
          last_synced_at: string | null;
          metadata: Json;
          organization_id: string;
          provider: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          credential_ref?: string | null;
          display_name: string;
          external_customer_id?: string | null;
          id?: string;
          kind: string;
          last_error_code?: string | null;
          last_synced_at?: string | null;
          metadata?: Json;
          organization_id: string;
          provider: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          credential_ref?: string | null;
          display_name?: string;
          external_customer_id?: string | null;
          id?: string;
          kind?: string;
          last_error_code?: string | null;
          last_synced_at?: string | null;
          metadata?: Json;
          organization_id?: string;
          provider?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "data_connections_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      forecast_points: {
        Row: {
          closing_balance: number;
          created_at: string;
          forecast_run_id: string;
          gap_amount: number;
          id: string;
          inflows: number;
          opening_balance: number;
          organization_id: string;
          outflows: number;
          point_date: string;
          safety_threshold: number;
        };
        Insert: {
          closing_balance: number;
          created_at?: string;
          forecast_run_id: string;
          gap_amount?: number;
          id?: string;
          inflows?: number;
          opening_balance: number;
          organization_id: string;
          outflows?: number;
          point_date: string;
          safety_threshold: number;
        };
        Update: {
          closing_balance?: number;
          created_at?: string;
          forecast_run_id?: string;
          gap_amount?: number;
          id?: string;
          inflows?: number;
          opening_balance?: number;
          organization_id?: string;
          outflows?: number;
          point_date?: string;
          safety_threshold?: number;
        };
        Relationships: [
          {
            foreignKeyName: "forecast_points_forecast_run_id_fkey";
            columns: ["forecast_run_id"];
            isOneToOne: false;
            referencedRelation: "forecast_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forecast_points_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      forecast_runs: {
        Row: {
          as_of: string;
          engine_version: string;
          error_code: string | null;
          error_message: string | null;
          finished_at: string | null;
          horizon_days: number;
          id: string;
          input_hash: string;
          input_snapshot: Json;
          organization_id: string;
          started_at: string;
          status: string;
        };
        Insert: {
          as_of: string;
          engine_version?: string;
          error_code?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          horizon_days: number;
          id?: string;
          input_hash: string;
          input_snapshot?: Json;
          organization_id: string;
          started_at?: string;
          status: string;
        };
        Update: {
          as_of?: string;
          engine_version?: string;
          error_code?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          horizon_days?: number;
          id?: string;
          input_hash?: string;
          input_snapshot?: Json;
          organization_id?: string;
          started_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forecast_runs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      liquidity_gaps: {
        Row: {
          amount: number;
          created_at: string;
          evidence: Json;
          explanation: string;
          forecast_run_id: string;
          gap_date: string;
          id: string;
          organization_id: string;
          severity: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          evidence?: Json;
          explanation: string;
          forecast_run_id: string;
          gap_date: string;
          id?: string;
          organization_id: string;
          severity: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          evidence?: Json;
          explanation?: string;
          forecast_run_id?: string;
          gap_date?: string;
          id?: string;
          organization_id?: string;
          severity?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "liquidity_gaps_forecast_run_id_fkey";
            columns: ["forecast_run_id"];
            isOneToOne: true;
            referencedRelation: "forecast_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "liquidity_gaps_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          invited_at: string | null;
          invited_by: string | null;
          joined_at: string | null;
          organization_id: string;
          role: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          organization_id: string;
          role: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          organization_id?: string;
          role?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          created_by: string;
          currency: string;
          daily_operating_expense: number;
          id: string;
          legal_name: string | null;
          minimum_cash_reserve: number;
          name: string;
          rfc: string | null;
          time_zone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          currency?: string;
          daily_operating_expense?: number;
          id?: string;
          legal_name?: string | null;
          minimum_cash_reserve?: number;
          name: string;
          rfc?: string | null;
          time_zone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          currency?: string;
          daily_operating_expense?: number;
          id?: string;
          legal_name?: string | null;
          minimum_cash_reserve?: number;
          name?: string;
          rfc?: string | null;
          time_zone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recommendations: {
        Row: {
          created_at: string;
          estimated_impact: number;
          evidence: Json;
          forecast_run_id: string;
          id: string;
          liquidity_gap_id: string | null;
          organization_id: string;
          priority: string;
          rationale: string;
          status: string;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          estimated_impact: number;
          evidence?: Json;
          forecast_run_id: string;
          id?: string;
          liquidity_gap_id?: string | null;
          organization_id: string;
          priority: string;
          rationale: string;
          status?: string;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          estimated_impact?: number;
          evidence?: Json;
          forecast_run_id?: string;
          id?: string;
          liquidity_gap_id?: string | null;
          organization_id?: string;
          priority?: string;
          rationale?: string;
          status?: string;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recommendations_forecast_run_id_fkey";
            columns: ["forecast_run_id"];
            isOneToOne: false;
            referencedRelation: "forecast_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recommendations_liquidity_gap_id_fkey";
            columns: ["liquidity_gap_id"];
            isOneToOne: false;
            referencedRelation: "liquidity_gaps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recommendations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_obligations: {
        Row: {
          active: boolean;
          amount: number;
          created_at: string;
          created_by: string;
          currency: string;
          frequency: string;
          id: string;
          metadata: Json;
          name: string;
          next_due_on: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          amount: number;
          created_at?: string;
          created_by: string;
          currency?: string;
          frequency: string;
          id?: string;
          metadata?: Json;
          name: string;
          next_due_on: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          amount?: number;
          created_at?: string;
          created_by?: string;
          currency?: string;
          frequency?: string;
          id?: string;
          metadata?: Json;
          name?: string;
          next_due_on?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_obligations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sync_runs: {
        Row: {
          connection_id: string;
          created_at: string;
          error_code: string | null;
          error_message: string | null;
          finished_at: string | null;
          id: string;
          organization_id: string;
          records_read: number;
          records_written: number;
          started_at: string;
          status: string;
        };
        Insert: {
          connection_id: string;
          created_at?: string;
          error_code?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          organization_id: string;
          records_read?: number;
          records_written?: number;
          started_at?: string;
          status: string;
        };
        Update: {
          connection_id?: string;
          created_at?: string;
          error_code?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          organization_id?: string;
          records_read?: number;
          records_written?: number;
          started_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sync_runs_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "data_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sync_runs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      treasury_decisions: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          input_hash: string;
          organization_id: string;
          plan: Json;
          plan_id: string;
          selected_at: string;
          steps: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          input_hash: string;
          organization_id: string;
          plan: Json;
          plan_id: string;
          selected_at?: string;
          steps?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          input_hash?: string;
          organization_id?: string;
          plan?: Json;
          plan_id?: string;
          selected_at?: string;
          steps?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treasury_decisions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
