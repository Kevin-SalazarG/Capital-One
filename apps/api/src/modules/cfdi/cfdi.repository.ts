import { Inject, Injectable } from "@nestjs/common";

import {
  assertDatabaseResult,
  throwDatabaseError,
} from "../../common/errors/supabase-error";
import { SupabaseService } from "../../common/database/supabase.service";
import type {
  CfdiImportBatchRow,
  CfdiInvoiceRow,
} from "../../common/database/database.types";
import type { CfdiDocumentDto } from "./dto/cfdi-document.dto";
import type { ListCfdiInvoicesQuery } from "./dto/list-cfdi-invoices.query";

@Injectable()
export class CfdiRepository {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  public async createImportBatch(
    organizationId: string,
    userId: string,
    accessToken: string,
    sourceName: string,
    sourceHash: string,
    documents: readonly CfdiDocumentDto[],
  ): Promise<{
    readonly batch: CfdiImportBatchRow;
    readonly invoices: CfdiInvoiceRow[];
  }> {
    const client = this.supabase.createUserClient(accessToken);
    const { data: batchData, error: batchError } = await client
      .from("cfdi_import_batches")
      .insert({
        organization_id: organizationId,
        source_name: sourceName,
        source_hash: sourceHash,
        imported_by: userId,
        records_read: documents.length,
      })
      .select("*")
      .single();
    const batch = assertDatabaseResult(
      batchData,
      batchError,
      "create CFDI import batch",
    );

    const rows = documents.map((document) => ({
      organization_id: organizationId,
      import_batch_id: batch.id,
      cfdi_uuid: document.cfdiUuid,
      direction: document.direction,
      issuer_rfc: document.issuerRfc,
      receiver_rfc: document.receiverRfc,
      counterparty_name: document.counterpartyName ?? null,
      issued_at: document.issuedAt,
      due_on: document.dueOn ?? null,
      total_amount: document.totalAmount,
      outstanding_amount: document.outstandingAmount,
      currency: document.currency ?? "MXN",
      payment_status: document.paymentStatus,
      expected_collection_probability:
        document.expectedCollectionProbability ?? null,
      metadata: document.metadata ?? {},
    }));
    const { data: invoiceData, error: invoiceError } = await client
      .from("cfdi_invoices")
      .upsert(rows, { onConflict: "organization_id,cfdi_uuid" })
      .select("*");
    if (invoiceError) {
      throwDatabaseError(invoiceError, "upsert CFDI invoices");
    }

    const { error: updateBatchError } = await client
      .from("cfdi_import_batches")
      .update({ records_created: invoiceData.length, records_updated: 0 })
      .eq("id", batch.id);
    if (updateBatchError) {
      throwDatabaseError(updateBatchError, "complete CFDI import batch");
    }

    return {
      batch: {
        ...batch,
        records_created: invoiceData.length,
        records_updated: 0,
      },
      invoices: invoiceData,
    };
  }

  public async listInvoices(
    organizationId: string,
    accessToken: string,
    query: ListCfdiInvoicesQuery,
  ): Promise<CfdiInvoiceRow[]> {
    const client = this.supabase.createUserClient(accessToken);
    let builder = client
      .from("cfdi_invoices")
      .select("*")
      .eq("organization_id", organizationId)
      .order("due_on", { ascending: true, nullsFirst: false })
      .limit(query.limit);
    if (query.direction) {
      builder = builder.eq("direction", query.direction);
    }
    if (query.paymentStatus) {
      builder = builder.eq("payment_status", query.paymentStatus);
    }
    const { data, error } = await builder;
    if (error) {
      throwDatabaseError(error, "list CFDI invoices");
    }
    return data;
  }

  public async listOpenInvoices(
    organizationId: string,
    accessToken: string,
  ): Promise<CfdiInvoiceRow[]> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("cfdi_invoices")
      .select("*")
      .eq("organization_id", organizationId)
      .in("payment_status", ["pending", "partial", "overdue"])
      .order("due_on", { ascending: true, nullsFirst: false });
    if (error) {
      throwDatabaseError(error, "list open CFDI invoices");
    }
    return data;
  }
}
