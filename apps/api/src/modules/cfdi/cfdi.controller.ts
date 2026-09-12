import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";

import {
  AccessToken,
  CurrentUser,
} from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { RequirePermissions } from "../../common/authorization/require-permissions.decorator";
import { CfdiService } from "./cfdi.service";
import { CreateCfdiImportDto } from "./dto/create-cfdi-import.dto";
import { ListCfdiInvoicesQuery } from "./dto/list-cfdi-invoices.query";

@Controller("organizations/:organizationId")
export class CfdiController {
  public constructor(
    @Inject(CfdiService) private readonly cfdiService: CfdiService,
  ) {}

  @Post("cfdi/imports")
  @RequirePermissions("cfdi:import")
  public import(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() body: CreateCfdiImportDto,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.cfdiService.import(organizationId, user, accessToken, body);
  }

  @Post("cfdi/demo-seed")
  @RequirePermissions("cfdi:import")
  public seedDemo(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.cfdiService.seedDemo(organizationId, user, accessToken);
  }

  @Get("invoices")
  @RequirePermissions("cfdi:read")
  public listInvoices(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Query() query: ListCfdiInvoicesQuery,
    @AccessToken() accessToken: string,
  ) {
    return this.cfdiService.listInvoices(organizationId, accessToken, query);
  }

  @Get("cfdi/invoices")
  @RequirePermissions("cfdi:read")
  public listInvoicesByCfdiPath(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Query() query: ListCfdiInvoicesQuery,
    @AccessToken() accessToken: string,
  ) {
    return this.cfdiService.listInvoices(organizationId, accessToken, query);
  }
}
