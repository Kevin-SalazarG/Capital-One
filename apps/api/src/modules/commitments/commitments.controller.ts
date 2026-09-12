import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  SerializeOptions,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { pageQuerySchema, parseIdentifier } from "../../platform/http/http-schemas.js";
import type { PageQuery } from "../../platform/http/http-schemas.js";
import { requestScope } from "../../platform/http/request-scope.js";
import { AuthGuard } from "../auth/auth-guard.js";
import type { AuthenticatedRequest } from "../auth/auth-guard.js";
import { BudgetsService } from "./budgets.service.js";
import { CommitmentsService } from "./commitments.service.js";
import {
  adjustmentSchema,
  budgetInputSchema,
  budgetListSchema,
  commitmentInputSchema,
  commitmentListSchema,
  commitmentWriteSchema,
  correctionSchema,
  reconciliationInputSchema,
  reconciliationSchema,
  recurringInputSchema,
} from "./commitment-schemas.js";
import type {
  AdjustmentInput,
  BudgetInput,
  BudgetList,
  CommitmentInput,
  CommitmentList,
  CommitmentWrite,
  CorrectionInput,
  ReconciliationInput,
  ReconciliationResult,
  RecurringInput,
} from "./commitment-schemas.js";

@Controller("businesses/:businessId")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CommitmentsController {
  constructor(
    @Inject(CommitmentsService) private readonly commitments: CommitmentsService,
    @Inject(BudgetsService) private readonly budgets: BudgetsService,
  ) {}
  @Get("commitments")
  @ApiOperation({ operationId: "listCommitments" })
  @ApiResponse({ status: 200, standardSchema: commitmentListSchema })
  @SerializeOptions({ schema: commitmentListSchema })
  list(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Query({ schema: pageQuerySchema }) page: PageQuery,
  ): Promise<CommitmentList> {
    return this.commitments.list(requestScope(request, businessId), page);
  }
  @Post("commitments")
  @HttpCode(200)
  @ApiOperation({ operationId: "createCommitment" })
  @ApiResponse({ status: 200, standardSchema: commitmentWriteSchema })
  @SerializeOptions({ schema: commitmentWriteSchema })
  create(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Body({ schema: commitmentInputSchema }) input: CommitmentInput,
  ): Promise<CommitmentWrite> {
    return this.commitments.create(requestScope(request, businessId), input);
  }
  @Patch("commitments/:id")
  @ApiOperation({ operationId: "updateCommitment" })
  @ApiResponse({ status: 200, standardSchema: commitmentWriteSchema })
  @SerializeOptions({ schema: commitmentWriteSchema })
  update(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Param("id") id: string,
    @Body({ schema: commitmentInputSchema }) input: CommitmentInput,
  ): Promise<CommitmentWrite> {
    return this.commitments.update(requestScope(request, businessId), parseIdentifier(id), input);
  }
  @Post("commitments/recurring")
  @HttpCode(200)
  @ApiOperation({ operationId: "createRecurringCommitments" })
  @ApiResponse({ status: 200, standardSchema: commitmentListSchema })
  @SerializeOptions({ schema: commitmentListSchema })
  recurring(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Body({ schema: recurringInputSchema }) input: RecurringInput,
  ): Promise<CommitmentList> {
    return this.commitments.recurring(requestScope(request, businessId), input);
  }
  @Patch("commitments/:id/adjustment")
  @ApiOperation({ operationId: "adjustOverhead" })
  @ApiResponse({ status: 200, standardSchema: commitmentWriteSchema })
  @SerializeOptions({ schema: commitmentWriteSchema })
  adjust(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Param("id") id: string,
    @Body({ schema: adjustmentSchema }) input: AdjustmentInput,
  ): Promise<CommitmentWrite> {
    return this.commitments.adjust(requestScope(request, businessId), parseIdentifier(id), input);
  }
  @Post("reconciliations")
  @HttpCode(200)
  @ApiOperation({ operationId: "reconcilePayment" })
  @ApiResponse({ status: 200, standardSchema: reconciliationSchema })
  @SerializeOptions({ schema: reconciliationSchema })
  reconcile(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Body({ schema: reconciliationInputSchema }) input: ReconciliationInput,
  ): Promise<ReconciliationResult> {
    return this.commitments.reconcile(requestScope(request, businessId), input);
  }
  @Post("reconciliations/:id/correction")
  @HttpCode(200)
  @ApiOperation({ operationId: "correctReconciliation" })
  @ApiResponse({ status: 200, standardSchema: reconciliationSchema })
  @SerializeOptions({ schema: reconciliationSchema })
  correct(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Param("id") id: string,
    @Body({ schema: correctionSchema }) input: CorrectionInput,
  ): Promise<ReconciliationResult> {
    return this.commitments.correctReconciliation(
      requestScope(request, businessId),
      parseIdentifier(id),
      input,
    );
  }
  @Get("budgets")
  @ApiOperation({ operationId: "listBudgets" })
  @ApiResponse({ status: 200, standardSchema: budgetListSchema })
  @SerializeOptions({ schema: budgetListSchema })
  listBudgets(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
  ): Promise<BudgetList> {
    return this.budgets.list(requestScope(request, businessId));
  }
  @Post("budgets")
  @HttpCode(200)
  @ApiOperation({ operationId: "setBudget" })
  @ApiResponse({ status: 200, standardSchema: budgetListSchema })
  @SerializeOptions({ schema: budgetListSchema })
  setBudget(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Body({ schema: budgetInputSchema }) input: BudgetInput,
  ): Promise<BudgetList> {
    return this.budgets.set(requestScope(request, businessId), input);
  }
}
