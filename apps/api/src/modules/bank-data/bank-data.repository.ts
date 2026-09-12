import { Inject, Injectable } from "@nestjs/common";

import {
  assertDatabaseResult,
  throwDatabaseError,
} from "../../common/errors/supabase-error";
import { SupabaseService } from "../../common/database/supabase.service";
import type {
  BankAccountRow,
  BankTransactionRow,
  SyncRunRow,
} from "../../common/database/database.types";
import type {
  ExternalBankAccount,
  ExternalBankTransaction,
} from "./domain/bank-provider.port";

@Injectable()
export class BankDataRepository {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  public async upsertAccounts(
    organizationId: string,
    connectionId: string,
    accessToken: string,
    accounts: readonly ExternalBankAccount[],
    syncedAt: string,
  ): Promise<BankAccountRow[]> {
    if (accounts.length === 0) {
      return [];
    }

    const client = this.supabase.createUserClient(accessToken);
    const rows = accounts.map((account) => ({
      organization_id: organizationId,
      connection_id: connectionId,
      external_id: account.externalId,
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance,
      available_balance: account.availableBalance,
      status: account.status,
      last_synced_at: syncedAt,
      metadata: account.metadata,
    }));
    const { data, error } = await client
      .from("bank_accounts")
      .upsert(rows, { onConflict: "connection_id,external_id" })
      .select("*");
    if (error) {
      throwDatabaseError(error, "upsert bank accounts");
    }
    return data;
  }

  public async upsertTransactions(
    organizationId: string,
    connectionId: string,
    accessToken: string,
    transactions: readonly ExternalBankTransaction[],
    accountIdsByExternalId: ReadonlyMap<string, string>,
  ): Promise<BankTransactionRow[]> {
    if (transactions.length === 0) {
      return [];
    }

    const client = this.supabase.createUserClient(accessToken);
    const rows = transactions.flatMap((transaction) => {
      const bankAccountId = accountIdsByExternalId.get(
        transaction.accountExternalId,
      );
      return bankAccountId
        ? [
            {
              organization_id: organizationId,
              connection_id: connectionId,
              bank_account_id: bankAccountId,
              external_id: transaction.externalId,
              direction: transaction.direction,
              amount: transaction.amount,
              currency: transaction.currency,
              description: transaction.description,
              posted_at: transaction.postedAt,
              status: transaction.status,
              metadata: transaction.metadata,
            },
          ]
        : [];
    });
    if (rows.length === 0) {
      return [];
    }

    const { data, error } = await client
      .from("bank_transactions")
      .upsert(rows, { onConflict: "connection_id,external_id" })
      .select("*");
    if (error) {
      throwDatabaseError(error, "upsert bank transactions");
    }
    return data;
  }

  public async listAccounts(
    organizationId: string,
    accessToken: string,
  ): Promise<BankAccountRow[]> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("bank_accounts")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true });
    if (error) {
      throwDatabaseError(error, "list bank accounts");
    }
    return data;
  }

  public async listTransactions(
    organizationId: string,
    accessToken: string,
    fromDate?: string,
    limit = 500,
  ): Promise<BankTransactionRow[]> {
    const client = this.supabase.createUserClient(accessToken);
    let query = client
      .from("bank_transactions")
      .select("*")
      .eq("organization_id", organizationId)
      .order("posted_at", { ascending: false })
      .limit(limit);
    if (fromDate) {
      query = query.gte("posted_at", fromDate);
    }
    const { data, error } = await query;
    if (error) {
      throwDatabaseError(error, "list bank transactions");
    }
    return data;
  }

  public async getAccountById(
    accountId: string,
    accessToken: string,
  ): Promise<BankAccountRow> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("bank_accounts")
      .select("*")
      .eq("id", accountId)
      .maybeSingle();
    if (error) {
      throwDatabaseError(error, "get bank account");
    }
    return assertDatabaseResult(data, null, "get bank account");
  }

  public async getSyncRun(
    organizationId: string,
    syncRunId: string,
    accessToken: string,
  ): Promise<SyncRunRow> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("sync_runs")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", syncRunId)
      .maybeSingle();
    if (error) {
      throwDatabaseError(error, "get bank sync run");
    }
    return assertDatabaseResult(data, null, "get bank sync run");
  }
}
