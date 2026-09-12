import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../../common/audit/audit.service";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { sha256 } from "../../common/utilities/stable-hash";
import type { JsonValue } from "../../common/types/json-value";
import { CfdiRepository } from "./cfdi.repository";
import type { CreateCfdiImportDto } from "./dto/create-cfdi-import.dto";
import type { ListCfdiInvoicesQuery } from "./dto/list-cfdi-invoices.query";
import { SyntheticCfdiProvider } from "./synthetic-cfdi.provider";

@Injectable()
export class CfdiService {
  public constructor(
    @Inject(CfdiRepository) private readonly repository: CfdiRepository,
    @Inject(SyntheticCfdiProvider)
    private readonly syntheticProvider: SyntheticCfdiProvider,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  public async import(
    organizationId: string,
    user: AuthenticatedUser,
    accessToken: string,
    input: CreateCfdiImportDto,
  ) {
    const hashInput: JsonValue = input.documents.map((document) => ({
      cfdiUuid: document.cfdiUuid,
      totalAmount: document.totalAmount,
      outstandingAmount: document.outstandingAmount,
      paymentStatus: document.paymentStatus,
    }));
    const result = await this.repository.createImportBatch(
      organizationId,
      user.id,
      accessToken,
      input.sourceName,
      sha256(hashInput),
      input.documents,
    );
    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: user.id,
      action: "cfdi.imported",
      resourceType: "cfdi_import_batch",
      resourceId: result.batch.id,
      metadata: {
        sourceName: input.sourceName,
        recordsRead: input.documents.length,
        recordsCreated: result.invoices.length,
      },
    });
    return result;
  }

  public async seedDemo(
    organizationId: string,
    user: AuthenticatedUser,
    accessToken: string,
  ) {
    const documents = this.syntheticProvider.createDemoDocuments();
    return this.import(organizationId, user, accessToken, {
      sourceName: "synthetic-demo",
      documents,
    });
  }

  public listInvoices(
    organizationId: string,
    accessToken: string,
    query: ListCfdiInvoicesQuery,
  ) {
    return this.repository.listInvoices(organizationId, accessToken, query);
  }

  public listOpenInvoices(organizationId: string, accessToken: string) {
    return this.repository.listOpenInvoices(organizationId, accessToken);
  }
}
