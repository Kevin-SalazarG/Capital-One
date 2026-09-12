import type {
  TreasuryDecision,
  TreasuryPlan,
} from "@colchon/treasury/treasury-contract";
import type { JsonValue } from "../../../common/types/json-value";
export interface TreasuryContext {
  readonly organizationId: string;
  readonly accessToken: string;
}
export interface DecisionSnapshot {
  readonly decision: TreasuryDecision;
  readonly revision: string;
}
export interface InvoicePlanningRecord {
  readonly id: string;
  readonly totalAmount: string;
  readonly direction: "receivable" | "payable";
  readonly metadata: JsonValue;
}
export interface TreasuryRepository {
  latest(context: TreasuryContext): Promise<TreasuryDecision | null>;
  save(
    context: TreasuryContext,
    userId: string,
    inputHash: string,
    plan: TreasuryPlan,
  ): Promise<TreasuryDecision>;
  find(context: TreasuryContext, id: string): Promise<DecisionSnapshot>;
  updateSteps(
    context: TreasuryContext,
    snapshot: DecisionSnapshot,
    steps: TreasuryDecision["steps"],
  ): Promise<TreasuryDecision>;
  findInvoice(
    context: TreasuryContext,
    id: string,
  ): Promise<InvoicePlanningRecord>;
  updateInvoice(
    context: TreasuryContext,
    row: InvoicePlanningRecord,
    input: InvoicePlanningInput,
  ): Promise<{ readonly id: string }>;
}

export interface InvoicePlanningInput {
  readonly dueOn: string;
  readonly earliestDate?: string | null;
  readonly latestDate?: string | null;
  readonly negotiationCost: string;
  readonly outstandingAmount?: string;
  readonly critical: boolean;
  readonly category: "payroll" | "tax" | "rent" | "supplier" | "other";
}
