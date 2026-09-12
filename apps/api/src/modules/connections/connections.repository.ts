import { Inject, Injectable } from "@nestjs/common";

import {
  assertDatabaseResult,
  throwDatabaseError,
} from "../../common/errors/supabase-error";
import { SupabaseService } from "../../common/database/supabase.service";
import type {
  ConnectionKind,
  ConnectionProvider,
  DataConnectionRow,
} from "../../common/database/database.types";
import type { CreateConnectionDto } from "./dto/create-connection.dto";
import type { UpdateConnectionDto } from "./dto/update-connection.dto";

@Injectable()
export class ConnectionsRepository {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  public async create(
    organizationId: string,
    userId: string,
    accessToken: string,
    input: CreateConnectionDto,
  ): Promise<DataConnectionRow> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("data_connections")
      .insert({
        organization_id: organizationId,
        kind: input.kind,
        provider: input.provider,
        display_name: input.displayName,
        external_customer_id: input.externalCustomerId ?? null,
        created_by: userId,
      })
      .select("*")
      .single();
    return assertDatabaseResult(data, error, "create data connection");
  }

  public async list(
    organizationId: string,
    accessToken: string,
  ): Promise<DataConnectionRow[]> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("data_connections")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });
    if (error) {
      throwDatabaseError(error, "list data connections");
    }
    return data;
  }

  public async update(
    organizationId: string,
    connectionId: string,
    accessToken: string,
    input: UpdateConnectionDto,
  ): Promise<DataConnectionRow> {
    const updates = {
      ...(input.displayName !== undefined
        ? { display_name: input.displayName }
        : {}),
      ...(input.externalCustomerId !== undefined
        ? { external_customer_id: input.externalCustomerId }
        : {}),
    };
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("data_connections")
      .update(updates)
      .eq("organization_id", organizationId)
      .eq("id", connectionId)
      .select("*")
      .maybeSingle();
    if (error) {
      throwDatabaseError(error, "update data connection");
    }
    return assertDatabaseResult(data, null, "update data connection");
  }

  public async revoke(
    organizationId: string,
    connectionId: string,
    accessToken: string,
  ): Promise<DataConnectionRow> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("data_connections")
      .update({ status: "revoked" })
      .eq("organization_id", organizationId)
      .eq("id", connectionId)
      .select("*")
      .maybeSingle();
    if (error) {
      throwDatabaseError(error, "revoke data connection");
    }
    return assertDatabaseResult(data, null, "revoke data connection");
  }

  public async getById(
    organizationId: string,
    connectionId: string,
    accessToken: string,
  ): Promise<DataConnectionRow> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("data_connections")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", connectionId)
      .maybeSingle();
    if (error) {
      throwDatabaseError(error, "get data connection");
    }
    return assertDatabaseResult(data, null, "get data connection");
  }

  public async markSyncCompleted(
    organizationId: string,
    connectionId: string,
    accessToken: string,
    syncedAt: string,
    externalCustomerId: string,
  ): Promise<void> {
    const client = this.supabase.createUserClient(accessToken);
    const { error } = await client
      .from("data_connections")
      .update({
        last_synced_at: syncedAt,
        status: "active",
        last_error_code: null,
        external_customer_id: externalCustomerId,
      })
      .eq("organization_id", organizationId)
      .eq("id", connectionId);
    if (error) {
      throwDatabaseError(error, "mark connection as synchronized");
    }
  }

  public async markSyncFailed(
    organizationId: string,
    connectionId: string,
    accessToken: string,
    errorCode: string,
  ): Promise<void> {
    const client = this.supabase.createUserClient(accessToken);
    const { error } = await client
      .from("data_connections")
      .update({ status: "error", last_error_code: errorCode })
      .eq("organization_id", organizationId)
      .eq("id", connectionId);
    if (error) {
      throwDatabaseError(error, "mark connection as failed");
    }
  }
}

export function isBankNessieConnection(
  connection: DataConnectionRow,
): connection is DataConnectionRow & {
  readonly kind: "bank";
  readonly provider: "nessie";
} {
  return (
    connection.kind === ("bank" satisfies ConnectionKind) &&
    connection.provider === ("nessie" satisfies ConnectionProvider)
  );
}
