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
import {
  pageQuerySchema,
  parseIdentifier,
  type PageQuery,
} from "../../platform/http/http-schemas.js";
import { requestScope } from "../../platform/http/request-scope.js";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth-guard.js";
import {
  type ConditionUpdateInput,
  type ConfirmationResult,
  type ConfirmDecisionInput,
  type DecisionHistory,
  type DecisionList,
  type DecisionResult,
  type ReevaluateDecisionInput,
  conditionUpdateSchema,
  confirmationResultSchema,
  confirmDecisionSchema,
  decisionHistorySchema,
  decisionListSchema,
  decisionResultSchema,
  reevaluateDecisionSchema,
} from "./decision-schemas.js";
import { DecisionsService } from "./decisions.service.js";

@Controller("businesses/:businessId/decisions")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DecisionsController {
  constructor(@Inject(DecisionsService) private readonly decisions: DecisionsService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ operationId: "confirmDecision" })
  @ApiResponse({ status: 200, standardSchema: confirmationResultSchema })
  @SerializeOptions({ schema: confirmationResultSchema })
  confirm(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Body({ schema: confirmDecisionSchema }) input: ConfirmDecisionInput,
  ): Promise<ConfirmationResult> {
    return this.decisions.confirm(requestScope(request, businessId), input);
  }

  @Get()
  @ApiOperation({ operationId: "listDecisions" })
  @ApiResponse({ status: 200, standardSchema: decisionListSchema })
  @SerializeOptions({ schema: decisionListSchema })
  list(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Query({ schema: pageQuerySchema }) page: PageQuery,
  ): Promise<DecisionList> {
    return this.decisions.list(requestScope(request, businessId), page);
  }

  @Get(":id")
  @ApiOperation({ operationId: "getDecision" })
  @ApiResponse({ status: 200, standardSchema: decisionResultSchema })
  @SerializeOptions({ schema: decisionResultSchema })
  get(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Param("id") id: string,
  ): Promise<DecisionResult> {
    return this.decisions.get(requestScope(request, businessId), parseIdentifier(id));
  }

  @Patch(":id/conditions/:conditionId")
  @ApiOperation({ operationId: "updateDecisionCondition" })
  @ApiResponse({ status: 200, standardSchema: decisionResultSchema })
  @SerializeOptions({ schema: decisionResultSchema })
  updateCondition(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Param("id") id: string,
    @Param("conditionId") conditionId: string,
    @Body({ schema: conditionUpdateSchema }) input: ConditionUpdateInput,
  ): Promise<DecisionResult> {
    return this.decisions.updateCondition(
      requestScope(request, businessId),
      parseIdentifier(id),
      parseIdentifier(conditionId),
      input,
    );
  }

  @Post(":id/reevaluate")
  @HttpCode(200)
  @ApiOperation({ operationId: "reevaluateDecision" })
  @ApiResponse({ status: 200, standardSchema: decisionResultSchema })
  @SerializeOptions({ schema: decisionResultSchema })
  reevaluate(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Param("id") id: string,
    @Body({ schema: reevaluateDecisionSchema }) input: ReevaluateDecisionInput,
  ): Promise<DecisionResult> {
    return this.decisions.reevaluate(requestScope(request, businessId), parseIdentifier(id), input);
  }

  @Get(":id/history")
  @ApiOperation({ operationId: "getDecisionHistory" })
  @ApiResponse({ status: 200, standardSchema: decisionHistorySchema })
  @SerializeOptions({ schema: decisionHistorySchema })
  history(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Param("id") id: string,
    @Query({ schema: pageQuerySchema }) page: PageQuery,
  ): Promise<DecisionHistory> {
    return this.decisions.history(requestScope(request, businessId), parseIdentifier(id), page);
  }
}
