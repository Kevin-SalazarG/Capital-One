import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Body,
} from "@nestjs/common";

import {
  AccessToken,
  CurrentUser,
} from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { RequirePermissions } from "../../common/authorization/require-permissions.decorator";
import { BankDataService } from "./bank-data.service";
import { ListBankTransactionsQuery } from "./dto/list-bank-transactions.query";
import { RunBankSyncDto } from "./dto/run-bank-sync.dto";

@Controller("organizations/:organizationId")
export class BankDataController {
  public constructor(
    @Inject(BankDataService) private readonly bankDataService: BankDataService,
  ) {}

  @Get("bank/accounts")
  @RequirePermissions("bank-account:read")
  public listAccounts(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @AccessToken() accessToken: string,
  ) {
    return this.bankDataService.listAccounts(organizationId, accessToken);
  }

  @Get("bank/transactions")
  @RequirePermissions("bank-transaction:read")
  public listTransactions(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Query() query: ListBankTransactionsQuery,
    @AccessToken() accessToken: string,
  ) {
    return this.bankDataService.listTransactions(
      organizationId,
      accessToken,
      query,
    );
  }

  @Post("connections/:connectionId/sync")
  @RequirePermissions("connection:sync")
  public sync(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("connectionId", new ParseUUIDPipe()) connectionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.bankDataService.sync(
      organizationId,
      connectionId,
      user,
      accessToken,
    );
  }

  @Post("syncs")
  @RequirePermissions("connection:sync")
  public runSync(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() body: RunBankSyncDto,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.bankDataService.sync(
      organizationId,
      body.connectionId,
      user,
      accessToken,
    );
  }

  @Get("syncs/:syncId")
  @RequirePermissions("connection:read")
  public getSyncRun(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("syncId", new ParseUUIDPipe()) syncRunId: string,
    @AccessToken() accessToken: string,
  ) {
    return this.bankDataService.getSyncRun(
      organizationId,
      syncRunId,
      accessToken,
    );
  }
}
