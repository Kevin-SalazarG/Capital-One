import { Inject, Injectable } from "@nestjs/common";

import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import type { ListBankTransactionsQuery } from "./dto/list-bank-transactions.query";
import { BankDataRepository } from "./bank-data.repository";
import { SyncBankDataUseCase } from "./sync-bank-data.use-case";

@Injectable()
export class BankDataService {
  public constructor(
    @Inject(BankDataRepository) private readonly repository: BankDataRepository,
    @Inject(SyncBankDataUseCase)
    private readonly syncUseCase: SyncBankDataUseCase,
  ) {}

  public sync(
    organizationId: string,
    connectionId: string,
    user: AuthenticatedUser,
    accessToken: string,
  ) {
    return this.syncUseCase.execute(
      organizationId,
      connectionId,
      user.id,
      accessToken,
    );
  }

  public listAccounts(organizationId: string, accessToken: string) {
    return this.repository.listAccounts(organizationId, accessToken);
  }

  public listTransactions(
    organizationId: string,
    accessToken: string,
    query: ListBankTransactionsQuery,
  ) {
    return this.repository.listTransactions(
      organizationId,
      accessToken,
      query.from,
      query.limit,
    );
  }

  public getSyncRun(
    organizationId: string,
    syncRunId: string,
    accessToken: string,
  ) {
    return this.repository.getSyncRun(organizationId, syncRunId, accessToken);
  }
}
