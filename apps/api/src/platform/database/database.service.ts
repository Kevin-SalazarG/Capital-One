import { Inject, Injectable } from "@nestjs/common";
import { createClient } from "@supabase/supabase-js";
import * as v from "valibot";
import { APP_CONFIG, type AppConfig } from "../../config/app-config.js";
import { ApiError } from "../http/api-error.js";
import {
  type Business,
  type BusinessState,
  type JsonValue,
  type SyncRun,
  businessSchema,
  businessStateSchema,
  syncRunSchema,
  toJson,
} from "./business-state.js";

export interface DatabaseScope {
  readonly userId: string;
  readonly businessId: string;
}

type RpcArguments = { [key: string]: JsonValue };
type RpcName =
  | "mirror_state"
  | "mirror_apply_state"
  | "mirror_list_businesses"
  | "mirror_session_status"
  | "mirror_revoke_session"
  | "mirror_begin_sync"
  | "mirror_seed_business"
  | "mirror_health";
interface SupabaseDatabase {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: { [Name in RpcName]: { Args: RpcArguments; Returns: JsonValue } };
  };
}
const collections = [
  "accounts",
  "movements",
  "syncRuns",
  "commitments",
  "budgets",
  "reconciliations",
  "evaluations",
  "decisions",
  "conditions",
  "idempotency",
  "auditEvents",
] as const;

@Injectable()
export class DatabaseService {
  private readonly client;

  public constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.client = createClient<SupabaseDatabase>(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      },
    );
  }

  public async ready(): Promise<boolean> {
    try {
      v.parse(v.object({ ready: v.literal(true) }), await this.rpc("mirror_health", {}));
      return true;
    } catch {
      return false;
    }
  }

  public async listBusinesses(userId: string): Promise<Business[]> {
    return v.parse(
      v.array(businessSchema),
      await this.rpc("mirror_list_businesses", { p_user_id: userId }),
    );
  }

  public async transaction<Result>(
    scope: DatabaseScope,
    operation: (state: BusinessState) => Promise<Result>,
  ): Promise<Result> {
    const args = { p_user_id: scope.userId, p_business_id: scope.businessId };
    const state = v.parse(businessStateSchema, await this.rpc("mirror_state", args));
    const revision = state.revision;
    const baseline = new Map<string, string>();
    for (const name of collections)
      for (const row of state[name]) baseline.set(`${name}:${row.id}`, JSON.stringify(toJson(row)));
    const originalBusiness = JSON.stringify(toJson(state.business));
    const result = await operation(state);
    const changes: Partial<Record<(typeof collections)[number] | "business", JsonValue>> = {};
    if (JSON.stringify(toJson(state.business)) !== originalBusiness)
      changes.business = toJson(state.business);
    for (const name of collections) {
      const changed = state[name].filter(
        (row) => baseline.get(`${name}:${row.id}`) !== JSON.stringify(toJson(row)),
      );
      if (changed.length > 0) changes[name] = toJson(changed);
      const remaining = new Set(state[name].map((row) => `${name}:${row.id}`));
      if ([...baseline.keys()].some((key) => key.startsWith(`${name}:`) && !remaining.has(key)))
        throw new Error("Business history cannot be deleted.");
    }
    if (Object.keys(changes).length > 0) {
      await this.rpc("mirror_apply_state", {
        ...args,
        p_revision: revision,
        p_changes: toJson(changes),
      });
    }
    return result;
  }

  public async advanceVersion(
    state: BusinessState,
    businessId: string,
    expectedVersion: number,
  ): Promise<number> {
    if (state.business.id !== businessId || state.business.planningVersion !== expectedVersion)
      throw planningConflict();
    state.business.planningVersion += 1;
    state.business.updatedAt = new Date();
    return state.business.planningVersion;
  }

  public async beginSync(
    scope: DatabaseScope,
    expectedVersion: number,
    cutoff: string,
  ): Promise<SyncRun> {
    return v.parse(
      syncRunSchema,
      await this.rpc("mirror_begin_sync", {
        p_user_id: scope.userId,
        p_business_id: scope.businessId,
        p_expected_version: expectedVersion,
        p_cutoff: cutoff,
      }),
    );
  }

  public async isSessionActive(userId: string, sessionId: string): Promise<boolean> {
    const status = v.parse(
      v.object({ active: v.boolean(), revoked: v.boolean() }),
      await this.rpc("mirror_session_status", { p_user_id: userId, p_session_id: sessionId }),
    );
    return status.active && !status.revoked;
  }

  public async revokeSession(userId: string, sessionId: string, expiresAt: Date): Promise<void> {
    await this.rpc("mirror_revoke_session", {
      p_user_id: userId,
      p_session_id: sessionId,
      p_expires_at: expiresAt.toISOString(),
    });
  }

  public async rpc(name: RpcName, args: RpcArguments): Promise<JsonValue> {
    if (Buffer.byteLength(JSON.stringify(args), "utf8") > 34_603_008) throw datasetLimit();
    const result = await this.client.rpc(name, args).abortSignal(AbortSignal.timeout(8_000));
    if (result.error) {
      if (result.error.message === "DATASET_LIMIT") throw datasetLimit();
      if (
        ["40001", "40P01", "23505"].includes(result.error.code) ||
        result.error.message === "PLANNING_VERSION_CONFLICT"
      )
        throw planningConflict();
      if (result.error.message === "BUSINESS_ACCESS_DENIED")
        throw new ApiError("BUSINESS_ACCESS_DENIED", "No tienes acceso a este negocio.", 403);
      if (result.error.message === "INVALID_STATE_CHANGE")
        throw new ApiError(
          "INVALID_STATE_CHANGE",
          "El cambio no cumple las reglas del negocio.",
          409,
        );
      throw new ApiError(
        "DATABASE_UNAVAILABLE",
        "No se pudo completar la operación de datos.",
        503,
      );
    }
    return toJson(result.data);
  }
}

function datasetLimit(): ApiError {
  return new ApiError(
    "DATASET_LIMIT",
    "El historial supera el tamaño admitido para este negocio. Los datos anteriores se conservan.",
    422,
  );
}

function planningConflict(): ApiError {
  return new ApiError(
    "PLANNING_VERSION_CONFLICT",
    "Los datos cambiaron. Actualiza la versión y vuelve a calcular.",
    409,
  );
}
