import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Req,
  SerializeOptions,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { requestScope } from "../../platform/http/request-scope.js";
import { AuthGuard, requestIdentity } from "../auth/auth-guard.js";
import type { AuthenticatedRequest } from "../auth/auth-guard.js";
import { businessListSchema, businessSchema, settingsSchema } from "./business-schemas.js";
import type { BusinessResult, SettingsInput } from "./business-schemas.js";
import { BusinessesService } from "./businesses.service.js";

@Controller("businesses")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class BusinessesController {
  constructor(@Inject(BusinessesService) private readonly businesses: BusinessesService) {}
  @Get()
  @ApiOperation({ operationId: "listBusinesses" })
  @ApiResponse({ status: 200, standardSchema: businessListSchema })
  @SerializeOptions({ schema: businessSchema })
  list(@Req() request: AuthenticatedRequest): Promise<BusinessResult[]> {
    return this.businesses.list(requestIdentity(request).userId);
  }
  @Get(":businessId")
  @ApiOperation({ operationId: "getBusiness" })
  @ApiResponse({ status: 200, standardSchema: businessSchema })
  @SerializeOptions({ schema: businessSchema })
  get(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
  ): Promise<BusinessResult> {
    return this.businesses.get(requestScope(request, businessId));
  }
  @Patch(":businessId/settings")
  @ApiOperation({ operationId: "updateSettings" })
  @ApiResponse({ status: 200, standardSchema: businessSchema })
  @SerializeOptions({ schema: businessSchema })
  update(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Body({ schema: settingsSchema }) input: SettingsInput,
  ): Promise<BusinessResult> {
    return this.businesses.update(requestScope(request, businessId), input);
  }
}
