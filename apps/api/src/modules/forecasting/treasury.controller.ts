import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  AccessToken,
  CurrentUser,
} from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { RequirePermissions } from "../../common/authorization/require-permissions.decorator";
import { GetTreasuryUseCase } from "./treasury/get-treasury.use-case";
import { ChooseTreasuryPlanUseCase } from "./treasury/choose-treasury-plan.use-case";
import { UpdateTreasuryActionUseCase } from "./treasury/update-treasury-action.use-case";
import { UpdateInvoicePlanningUseCase } from "./treasury/update-invoice-planning.use-case";
import { ChooseTreasuryPlanDto } from "./treasury/choose-treasury-plan.dto";
import { UpdateTreasuryActionDto } from "./treasury/update-treasury-action.dto";
import { UpdateInvoicePlanningDto } from "./treasury/update-invoice-planning.dto";
import { PreviewTreasuryDto } from "./treasury/preview-treasury.dto";
import type {
  Treasury,
  TreasuryDecision,
} from "@colchon/treasury/treasury-contract";
@Controller("organizations/:organizationId/treasury")
export class TreasuryController {
  public constructor(
    @Inject(GetTreasuryUseCase) private readonly read: GetTreasuryUseCase,
    @Inject(ChooseTreasuryPlanUseCase)
    private readonly choose: ChooseTreasuryPlanUseCase,
    @Inject(UpdateTreasuryActionUseCase)
    private readonly updateAction: UpdateTreasuryActionUseCase,
    @Inject(UpdateInvoicePlanningUseCase)
    private readonly updateInvoice: UpdateInvoicePlanningUseCase,
  ) {}
  @Get()
  @RequirePermissions("forecast:read", "bank-account:read")
  public get(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @AccessToken() accessToken: string,
    @Query() query: PreviewTreasuryDto,
  ): Promise<Treasury> {
    return this.read.execute(
      { organizationId, accessToken },
      query.delayedReceiptId,
    );
  }
  @Post("decisions")
  @RequirePermissions("recommendation:update")
  public save(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @AccessToken() accessToken: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChooseTreasuryPlanDto,
  ): Promise<TreasuryDecision> {
    return this.choose.execute({ organizationId, accessToken }, user.id, body);
  }
  @Patch("decisions/:id")
  @RequirePermissions("recommendation:update")
  public step(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @AccessToken() accessToken: string,
    @Body() body: UpdateTreasuryActionDto,
  ): Promise<TreasuryDecision> {
    return this.updateAction.execute({ organizationId, accessToken }, id, body);
  }
  @Patch("invoices/:id")
  @RequirePermissions("cfdi:import")
  public invoice(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @AccessToken() accessToken: string,
    @Body() body: UpdateInvoicePlanningDto,
  ): Promise<{ readonly id: string }> {
    return this.updateInvoice.execute(
      { organizationId, accessToken },
      id,
      body,
    );
  }
}
