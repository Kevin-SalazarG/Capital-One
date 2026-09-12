import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  SerializeOptions,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { successSchema } from "../../platform/http/http-schemas.js";
import type { SuccessResult } from "../../platform/http/http-schemas.js";
import { AuthGuard, bearerToken, requestIdentity } from "./auth-guard.js";
import type { AuthenticatedRequest } from "./auth-guard.js";
import { AuthProvider } from "./auth-provider.js";
import { identitySchema, loginSchema, refreshSchema, sessionSchema } from "./auth-schemas.js";
import type { Identity, LoginInput, RefreshInput, SessionResult } from "./auth-schemas.js";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthProvider) private readonly provider: AuthProvider) {}
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ operationId: "login" })
  @ApiResponse({ status: 200, standardSchema: sessionSchema })
  @SerializeOptions({ schema: sessionSchema })
  login(@Body({ schema: loginSchema }) input: LoginInput): Promise<SessionResult> {
    return this.provider.login(input);
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ operationId: "refreshSession" })
  @ApiResponse({ status: 200, standardSchema: sessionSchema })
  @SerializeOptions({ schema: sessionSchema })
  refresh(@Body({ schema: refreshSchema }) input: RefreshInput): Promise<SessionResult> {
    return this.provider.refresh(input.refreshToken);
  }

  @Get("session")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ operationId: "getSession" })
  @ApiResponse({ status: 200, standardSchema: identitySchema })
  @SerializeOptions({ schema: identitySchema })
  session(@Req() request: AuthenticatedRequest): Identity {
    return requestIdentity(request);
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ operationId: "logout" })
  @ApiResponse({ status: 200, standardSchema: successSchema })
  @SerializeOptions({ schema: successSchema })
  async logout(@Req() request: AuthenticatedRequest): Promise<SuccessResult> {
    await this.provider.logout(bearerToken(request));
    return { success: true };
  }
}
