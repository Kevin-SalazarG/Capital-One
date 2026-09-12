import type { JsonValue } from "../types/json-value";

export type OrganizationRole = "owner" | "admin" | "analyst" | "viewer";
export type MembershipStatus = "active" | "invited" | "suspended";
export type ConnectionKind = "bank" | "cfdi";
export type ConnectionProvider = "nessie" | "synthetic_cfdi";
export type SyncStatus = "running" | "completed" | "failed";
export type TransactionDirection = "inflow" | "outflow" | "transfer";
export type CfdiDirection = "receivable" | "payable";
export type CfdiPaymentStatus =
  "pending" | "partial" | "paid" | "overdue" | "cancelled";
export type ForecastStatus = "running" | "completed" | "failed";
export type RecommendationStatus =
  "open" | "accepted" | "dismissed" | "completed";

export interface OrganizationRow {
  id: string;
  name: string;
  legal_name: string | null;
  rfc: string | null;
  currency: string;
  time_zone: string;
  minimum_cash_reserve: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMemberRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  status: MembershipStatus;
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataConnectionRow {
  id: string;
  organization_id: string;
  kind: ConnectionKind;
  provider: ConnectionProvider;
  display_name: string;
  external_customer_id: string | null;
  credential_ref: string | null;
  status: "active" | "paused" | "revoked" | "error";
  last_synced_at: string | null;
  last_error_code: string | null;
  metadata: JsonValue;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SyncRunRow {
  id: string;
  organization_id: string;
  connection_id: string;
  status: SyncStatus;
  started_at: string;
  finished_at: string | null;
  records_read: number;
  records_written: number;
  error_code: string | null;
  error_message: string | null;
}

export interface BankAccountRow {
  id: string;
  organization_id: string;
  connection_id: string;
  external_id: string;
  name: string;
  type: string;
  currency: string;
  balance: string;
  available_balance: string | null;
  status: string;
  last_synced_at: string | null;
  metadata: JsonValue;
  created_at: string;
  updated_at: string;
}

export interface BankTransactionRow {
  id: string;
  organization_id: string;
  connection_id: string;
  bank_account_id: string;
  external_id: string;
  direction: TransactionDirection;
  amount: string;
  currency: string;
  description: string | null;
  posted_at: string;
  status: string;
  category: string | null;
  metadata: JsonValue;
  created_at: string;
  updated_at: string;
}

export interface CfdiImportBatchRow {
  id: string;
  organization_id: string;
  source_name: string;
  source_hash: string;
  source_object_path: string | null;
  imported_by: string;
  imported_at: string;
  records_read: number;
  records_created: number;
  records_updated: number;
}

export interface CfdiInvoiceRow {
  id: string;
  organization_id: string;
  import_batch_id: string | null;
  cfdi_uuid: string;
  direction: CfdiDirection;
  issuer_rfc: string;
  receiver_rfc: string;
  counterparty_name: string | null;
  issued_at: string;
  due_on: string | null;
  total_amount: string;
  outstanding_amount: string;
  currency: string;
  payment_status: CfdiPaymentStatus;
  expected_collection_probability: number | null;
  metadata: JsonValue;
  created_at: string;
  updated_at: string;
}

export interface RecurringObligationRow {
  id: string;
  organization_id: string;
  name: string;
  amount: string;
  currency: string;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  next_due_on: string;
  active: boolean;
  metadata: JsonValue;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ForecastRunRow {
  id: string;
  organization_id: string;
  status: ForecastStatus;
  horizon_days: number;
  as_of: string;
  input_hash: string;
  input_snapshot: JsonValue;
  engine_version: string;
  started_at: string;
  finished_at: string | null;
  error_code: string | null;
  error_message: string | null;
}

export interface ForecastPointRow {
  id: string;
  forecast_run_id: string;
  organization_id: string;
  point_date: string;
  opening_balance: string;
  inflows: string;
  outflows: string;
  closing_balance: string;
  safety_threshold: string;
  gap_amount: string;
  created_at: string;
}

export interface LiquidityGapRow {
  id: string;
  organization_id: string;
  forecast_run_id: string;
  gap_date: string;
  amount: string;
  severity: "warning" | "critical";
  status: "open" | "resolved" | "ignored";
  explanation: string;
  evidence: JsonValue;
  created_at: string;
  updated_at: string;
}

export interface RecommendationRow {
  id: string;
  organization_id: string;
  forecast_run_id: string;
  liquidity_gap_id: string | null;
  type:
    | "collect_receivable"
    | "schedule_payment"
    | "reduce_outflow"
    | "increase_buffer";
  title: string;
  rationale: string;
  priority: "low" | "medium" | "high" | "critical";
  estimated_impact: string;
  status: RecommendationStatus;
  evidence: JsonValue;
  created_at: string;
  updated_at: string;
}

export interface AuditEventRow {
  id: string;
  organization_id: string | null;
  actor_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: JsonValue;
  request_id: string | null;
  created_at: string;
}

type TableDefinition<Row, Insert, Update> = {
  Row: Row & Record<string, unknown>;
  Insert: Insert & Record<string, unknown>;
  Update: Update & Record<string, unknown>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      organizations: TableDefinition<
        OrganizationRow,
        Partial<OrganizationRow> & Pick<OrganizationRow, "name" | "created_by">,
        Partial<OrganizationRow>
      >;
      organization_members: TableDefinition<
        OrganizationMemberRow,
        Partial<OrganizationMemberRow> &
          Pick<OrganizationMemberRow, "organization_id" | "user_id" | "role">,
        Partial<OrganizationMemberRow>
      >;
      data_connections: TableDefinition<
        DataConnectionRow,
        Partial<DataConnectionRow> &
          Pick<
            DataConnectionRow,
            | "organization_id"
            | "kind"
            | "provider"
            | "display_name"
            | "created_by"
          >,
        Partial<DataConnectionRow>
      >;
      sync_runs: TableDefinition<
        SyncRunRow,
        Partial<SyncRunRow> &
          Pick<SyncRunRow, "organization_id" | "connection_id" | "status">,
        Partial<SyncRunRow>
      >;
      bank_accounts: TableDefinition<
        BankAccountRow,
        Partial<BankAccountRow> &
          Pick<
            BankAccountRow,
            | "organization_id"
            | "connection_id"
            | "external_id"
            | "name"
            | "type"
            | "currency"
            | "balance"
          >,
        Partial<BankAccountRow>
      >;
      bank_transactions: TableDefinition<
        BankTransactionRow,
        Partial<BankTransactionRow> &
          Pick<
            BankTransactionRow,
            | "organization_id"
            | "connection_id"
            | "bank_account_id"
            | "external_id"
            | "direction"
            | "amount"
            | "currency"
            | "posted_at"
          >,
        Partial<BankTransactionRow>
      >;
      cfdi_import_batches: TableDefinition<
        CfdiImportBatchRow,
        Partial<CfdiImportBatchRow> &
          Pick<
            CfdiImportBatchRow,
            "organization_id" | "source_name" | "source_hash" | "imported_by"
          >,
        Partial<CfdiImportBatchRow>
      >;
      cfdi_invoices: TableDefinition<
        CfdiInvoiceRow,
        Partial<CfdiInvoiceRow> &
          Pick<
            CfdiInvoiceRow,
            | "organization_id"
            | "cfdi_uuid"
            | "direction"
            | "issuer_rfc"
            | "receiver_rfc"
            | "issued_at"
            | "total_amount"
            | "outstanding_amount"
            | "currency"
            | "payment_status"
          >,
        Partial<CfdiInvoiceRow>
      >;
      recurring_obligations: TableDefinition<
        RecurringObligationRow,
        Partial<RecurringObligationRow> &
          Pick<
            RecurringObligationRow,
            | "organization_id"
            | "name"
            | "amount"
            | "currency"
            | "frequency"
            | "next_due_on"
            | "created_by"
          >,
        Partial<RecurringObligationRow>
      >;
      forecast_runs: TableDefinition<
        ForecastRunRow,
        Partial<ForecastRunRow> &
          Pick<
            ForecastRunRow,
            | "organization_id"
            | "status"
            | "horizon_days"
            | "as_of"
            | "input_hash"
            | "input_snapshot"
            | "engine_version"
          >,
        Partial<ForecastRunRow>
      >;
      forecast_points: TableDefinition<
        ForecastPointRow,
        Partial<ForecastPointRow> &
          Pick<
            ForecastPointRow,
            | "forecast_run_id"
            | "organization_id"
            | "point_date"
            | "opening_balance"
            | "inflows"
            | "outflows"
            | "closing_balance"
            | "safety_threshold"
            | "gap_amount"
          >,
        Partial<ForecastPointRow>
      >;
      liquidity_gaps: TableDefinition<
        LiquidityGapRow,
        Partial<LiquidityGapRow> &
          Pick<
            LiquidityGapRow,
            | "organization_id"
            | "forecast_run_id"
            | "gap_date"
            | "amount"
            | "severity"
            | "explanation"
          >,
        Partial<LiquidityGapRow>
      >;
      recommendations: TableDefinition<
        RecommendationRow,
        Partial<RecommendationRow> &
          Pick<
            RecommendationRow,
            | "organization_id"
            | "forecast_run_id"
            | "type"
            | "title"
            | "rationale"
            | "priority"
            | "estimated_impact"
          >,
        Partial<RecommendationRow>
      >;
      audit_events: TableDefinition<
        AuditEventRow,
        Partial<AuditEventRow> &
          Pick<AuditEventRow, "action" | "resource_type">,
        Partial<AuditEventRow>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
