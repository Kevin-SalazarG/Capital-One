import { Inject, Injectable } from "@nestjs/common";
import Decimal from "decimal.js";
import {
  decisionSchema,
  type TreasuryDecision,
  type TreasuryPlan,
} from "@colchon/treasury/treasury-contract";
import { AppError } from "../../../common/errors/app-error";
import {
  assertDatabaseResult,
  throwDatabaseError,
} from "../../../common/errors/supabase-error";
import { SupabaseService } from "../../../common/database/supabase.service";
import type { TreasuryDecisionRow } from "../../../common/database/database.types";
import type {
  TreasuryRepository,
  TreasuryContext,
  DecisionSnapshot,
  InvoicePlanningRecord,
  InvoicePlanningInput,
} from "./treasury-repository.port";
const DECISION_COLUMNS =
  "id,organization_id,input_hash,plan_id,plan,steps,created_by,created_at,updated_at,selected_at";
function toDecision(row: TreasuryDecisionRow): TreasuryDecision {
  return decisionSchema.parse({
    id: row.id,
    inputHash: row.input_hash,
    planId: row.plan_id,
    createdAt: row.created_at,
    plan: row.plan,
    steps: row.steps,
  });
}
@Injectable()
export class SupabaseTreasuryRepository implements TreasuryRepository {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}
  public async latest(c: TreasuryContext): Promise<TreasuryDecision | null> {
    const { data, error } = await this.supabase
      .createUserClient(c.accessToken)
      .from("treasury_decisions")
      .select(DECISION_COLUMNS)
      .eq("organization_id", c.organizationId)
      .order("selected_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throwDatabaseError(error, "read treasury decision");
    return data ? toDecision(data) : null;
  }
  public async save(
    c: TreasuryContext,
    userId: string,
    inputHash: string,
    plan: TreasuryPlan,
  ): Promise<TreasuryDecision> {
    const client = this.supabase.createUserClient(c.accessToken);
    const { data, error } = await client
      .from("treasury_decisions")
      .insert({
        organization_id: c.organizationId,
        input_hash: inputHash,
        plan_id: plan.id,
        plan,
        created_by: userId,
      })
      .select(DECISION_COLUMNS)
      .single();
    if (error?.code === "23505") {
      const existing = await client
        .from("treasury_decisions")
        .update({ selected_at: new Date().toISOString() })
        .eq("organization_id", c.organizationId)
        .eq("input_hash", inputHash)
        .eq("plan_id", plan.id)
        .select(DECISION_COLUMNS)
        .single();
      return toDecision(
        assertDatabaseResult(
          existing.data,
          existing.error,
          "read existing decision",
        ),
      );
    }
    return toDecision(assertDatabaseResult(data, error, "save decision"));
  }
  public async find(c: TreasuryContext, id: string): Promise<DecisionSnapshot> {
    const { data, error } = await this.supabase
      .createUserClient(c.accessToken)
      .from("treasury_decisions")
      .select(DECISION_COLUMNS)
      .eq("organization_id", c.organizationId)
      .eq("id", id)
      .maybeSingle();
    const row = assertDatabaseResult(data, error, "read decision");
    return { decision: toDecision(row), revision: row.updated_at };
  }
  public async updateSteps(
    c: TreasuryContext,
    snapshot: DecisionSnapshot,
    steps: TreasuryDecision["steps"],
  ): Promise<TreasuryDecision> {
    const { data, error } = await this.supabase
      .createUserClient(c.accessToken)
      .from("treasury_decisions")
      .update({ steps, updated_at: new Date().toISOString() })
      .eq("organization_id", c.organizationId)
      .eq("id", snapshot.decision.id)
      .eq("updated_at", snapshot.revision)
      .select(DECISION_COLUMNS)
      .maybeSingle();
    if (error) throwDatabaseError(error, "update decision");
    if (!data)
      throw new AppError("Decision changed; refresh", {
        code: "PLAN_STALE",
        status: 409,
      });
    return toDecision(data);
  }
  public async findInvoice(
    c: TreasuryContext,
    id: string,
  ): Promise<InvoicePlanningRecord> {
    const { data, error } = await this.supabase
      .createUserClient(c.accessToken)
      .from("cfdi_invoices")
      .select("id,total_amount,direction,metadata")
      .eq("organization_id", c.organizationId)
      .eq("id", id)
      .maybeSingle();
    const row = assertDatabaseResult(data, error, "read invoice");
    return {
      id: row.id,
      totalAmount: row.total_amount,
      direction: row.direction,
      metadata: row.metadata,
    };
  }
  public async updateInvoice(
    c: TreasuryContext,
    row: InvoicePlanningRecord,
    input: InvoicePlanningInput,
  ): Promise<{ readonly id: string }> {
    const meta =
      row.metadata &&
      typeof row.metadata === "object" &&
      !Array.isArray(row.metadata)
        ? row.metadata
        : {};
    const { data, error } = await this.supabase
      .createUserClient(c.accessToken)
      .from("cfdi_invoices")
      .update({
        due_on: input.dueOn,
        metadata: {
          ...meta,
          category: input.category,
          critical: input.critical,
          earliestDate: input.earliestDate ?? null,
          latestDate: input.latestDate ?? null,
          negotiationCost: input.negotiationCost,
        },
        ...(input.outstandingAmount !== undefined
          ? {
              outstanding_amount: input.outstandingAmount,
              payment_status: new Decimal(input.outstandingAmount).isZero()
                ? ("paid" as const)
                : new Decimal(input.outstandingAmount).lt(row.totalAmount)
                  ? ("partial" as const)
                  : ("pending" as const),
            }
          : {}),
      })
      .eq("organization_id", c.organizationId)
      .eq("id", row.id)
      .select("id")
      .single();
    return assertDatabaseResult(data, error, "update invoice planning");
  }
}
