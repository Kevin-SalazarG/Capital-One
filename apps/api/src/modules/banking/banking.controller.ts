import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  Req,
  SerializeOptions,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  pageQuerySchema,
  parseIdentifier,
  type PageQuery,
} from "../../platform/http/http-schemas.js";
import { requestScope } from "../../platform/http/request-scope.js";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth-guard.js";
import {
  bankAccountSchema,
  bankMovementListSchema,
  latestSyncSchema,
  syncRequestSchema,
  syncResultSchema,
  syncRunSchema,
  type BankAccountResult,
  type BankMovementListResult,
  type SyncRequest,
  type SyncResult,
  type SyncRunResult,
} from "./banking-schemas.js";
import { BankingService } from "./banking.service.js";

@Controller("businesses/:businessId/banking")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class BankingController {
  constructor(@Inject(BankingService) private readonly banking: BankingService) {}

  @Get("account")
  @ApiOperation({ operationId: "getBankAccount" })
  @ApiResponse({ status: 200, standardSchema: bankAccountSchema })
  @SerializeOptions({ schema: bankAccountSchema })
  getAccount(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
  ): Promise<BankAccountResult> {
    return this.banking.getAccount(requestScope(request, businessId));
  }

  @Get("movements")
  @ApiOperation({ operationId: "listBankMovements" })
  @ApiResponse({ status: 200, standardSchema: bankMovementListSchema })
  @SerializeOptions({ schema: bankMovementListSchema })
  listMovements(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Query({ schema: pageQuerySchema }) page: PageQuery,
  ): Promise<BankMovementListResult> {
    return this.banking.listMovements(requestScope(request, businessId), page);
  }

  @Get("sync-runs/:runId")
  @ApiOperation({ operationId: "getBankSyncRun" })
  @ApiResponse({ status: 200, standardSchema: syncRunSchema })
  @SerializeOptions({ schema: syncRunSchema })
  getSyncRun(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Param("runId") runId: string,
  ): Promise<SyncRunResult> {
    return this.banking.getSyncRun(requestScope(request, businessId), parseIdentifier(runId));
  }

  @Get("sync-status")
  @ApiOperation({ operationId: "getLatestBankSyncRun" })
  @ApiResponse({ status: 200, standardSchema: latestSyncSchema })
  @SerializeOptions({ schema: latestSyncSchema })
  getLatestSyncRun(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
  ): Promise<SyncRunResult | null> {
    return this.banking.getLatestSyncRun(requestScope(request, businessId));
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ operationId: "refreshBanking" })
  @ApiResponse({ status: 200, standardSchema: syncResultSchema })
  @SerializeOptions({ schema: syncResultSchema })
  async refresh(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Body({ schema: syncRequestSchema }) input: SyncRequest,
  ): Promise<SyncResult> {
    const cancellation = new AbortController();
    const cancel = (): void => cancellation.abort();
    request.once("aborted", cancel);
    try {
      return await this.banking.sync(
        requestScope(request, businessId),
        input.expectedVersion,
        cancellation.signal,
      );
    } finally {
      request.off("aborted", cancel);
    }
  }
}
