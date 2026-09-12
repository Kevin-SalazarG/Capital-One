import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../../common/audit/audit.service";
import { AppError } from "../../common/errors/app-error";
import {
  assertDatabaseResult,
  throwDatabaseError,
} from "../../common/errors/supabase-error";
import { SupabaseService } from "../../common/database/supabase.service";
import {
  ConnectionsRepository,
  isBankNessieConnection,
} from "../connections/connections.repository";
import {
  BANK_PROVIDER_PORT,
  type BankProviderPort,
} from "./domain/bank-provider.port";
import { BankDataRepository } from "./bank-data.repository";
import { mapNessieError } from "./infrastructure/nessie-error.mapper";

export interface SyncBankDataResult {
  readonly syncRunId: string;
  readonly status: "completed";
  readonly recordsRead: number;
  readonly recordsWritten: number;
  readonly syncedAt: string;
}

@Injectable()
export class SyncBankDataUseCase {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
    @Inject(ConnectionsRepository)
    private readonly connections: ConnectionsRepository,
    @Inject(BankDataRepository) private readonly bankData: BankDataRepository,
    @Inject(BANK_PROVIDER_PORT) private readonly provider: BankProviderPort,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  public async execute(
    organizationId: string,
    connectionId: string,
    actorUserId: string,
    accessToken: string,
  ): Promise<SyncBankDataResult> {
    const connection = await this.connections.getById(
      organizationId,
      connectionId,
      accessToken,
    );
    if (!isBankNessieConnection(connection)) {
      throw new AppError("The connection is not a Nessie bank connection", {
        code: "VALIDATION_FAILED",
        status: 400,
      });
    }

    const startedAt = new Date().toISOString();
    const client = this.supabase.createUserClient(accessToken);
    const { data: syncRun, error: syncRunError } = await client
      .from("sync_runs")
      .insert({
        organization_id: organizationId,
        connection_id: connectionId,
        status: "running",
        started_at: startedAt,
      })
      .select("*")
      .single();
    const run = assertDatabaseResult(
      syncRun,
      syncRunError,
      "create bank sync run",
    );

    try {
      const snapshot = await this.provider.sync(
        connection.external_customer_id,
      );
      const syncedAt = new Date().toISOString();
      const accounts = await this.bankData.upsertAccounts(
        organizationId,
        connectionId,
        accessToken,
        snapshot.accounts,
        syncedAt,
      );
      const accountIdsByExternalId = new Map(
        accounts.map((account) => [account.external_id, account.id] as const),
      );
      const transactions = await this.bankData.upsertTransactions(
        organizationId,
        connectionId,
        accessToken,
        snapshot.transactions,
        accountIdsByExternalId,
      );
      const recordsWritten = accounts.length + transactions.length;

      const { error: syncCompleteError } = await client
        .from("sync_runs")
        .update({
          status: "completed",
          finished_at: syncedAt,
          records_read: snapshot.recordsRead,
          records_written: recordsWritten,
        })
        .eq("id", run.id);
      if (syncCompleteError) {
        throwDatabaseError(syncCompleteError, "complete bank sync run");
      }
      await this.connections.markSyncCompleted(
        organizationId,
        connectionId,
        accessToken,
        syncedAt,
        snapshot.externalCustomerId,
      );
      await this.audit.record(accessToken, {
        organizationId,
        actorUserId,
        action: "connection.sync_completed",
        resourceType: "sync_run",
        resourceId: run.id,
        metadata: {
          provider: snapshot.provider,
          recordsRead: snapshot.recordsRead,
          recordsWritten,
        },
      });

      return {
        syncRunId: run.id,
        status: "completed",
        recordsRead: snapshot.recordsRead,
        recordsWritten,
        syncedAt,
      };
    } catch (error) {
      const mappedError =
        error instanceof AppError ? error : mapNessieError(error);
      const errorCode = mappedError.code;
      const { error: syncUpdateError } = await client
        .from("sync_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_code: errorCode,
          error_message: mappedError.message,
        })
        .eq("id", run.id);
      if (syncUpdateError) {
        throwDatabaseError(syncUpdateError, "mark bank sync run as failed");
      }
      await this.connections.markSyncFailed(
        organizationId,
        connectionId,
        accessToken,
        errorCode,
      );

      throw mappedError;
    }
  }
}
