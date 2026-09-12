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
  type EvaluationInput,
  type EvaluationList,
  type EvaluationResult,
  type ForecastEnvelope,
  type ForecastOptions,
  evaluationInputSchema,
  evaluationListSchema,
  evaluationResultSchema,
  forecastEnvelopeSchema,
  forecastQuerySchema,
} from "./planning-schemas.js";
import { PlanningService } from "./planning.service.js";

@Controller("businesses/:businessId")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PlanningController {
  constructor(@Inject(PlanningService) private readonly planning: PlanningService) {}

  @Get("forecast")
  @ApiOperation({ operationId: "getForecast" })
  @ApiResponse({ status: 200, standardSchema: forecastEnvelopeSchema })
  @SerializeOptions({ schema: forecastEnvelopeSchema })
  forecast(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Query({ schema: forecastQuerySchema }) options: ForecastOptions,
  ): Promise<ForecastEnvelope> {
    return this.planning.forecast(requestScope(request, businessId), options);
  }

  @Post("evaluations")
  @HttpCode(200)
  @ApiOperation({ operationId: "evaluateJob" })
  @ApiResponse({ status: 200, standardSchema: evaluationResultSchema })
  @SerializeOptions({ schema: evaluationResultSchema })
  evaluate(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Body({ schema: evaluationInputSchema }) input: EvaluationInput,
  ): Promise<EvaluationResult> {
    return this.planning.evaluate(requestScope(request, businessId), input);
  }

  @Get("evaluations")
  @ApiOperation({ operationId: "listEvaluations" })
  @ApiResponse({ status: 200, standardSchema: evaluationListSchema })
  @SerializeOptions({ schema: evaluationListSchema })
  list(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Query({ schema: pageQuerySchema }) page: PageQuery,
  ): Promise<EvaluationList> {
    return this.planning.list(requestScope(request, businessId), page);
  }

  @Get("evaluations/:id")
  @ApiOperation({ operationId: "getEvaluation" })
  @ApiResponse({ status: 200, standardSchema: evaluationResultSchema })
  @SerializeOptions({ schema: evaluationResultSchema })
  get(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Param("id") id: string,
  ): Promise<EvaluationResult> {
    return this.planning.get(requestScope(request, businessId), parseIdentifier(id));
  }
}
