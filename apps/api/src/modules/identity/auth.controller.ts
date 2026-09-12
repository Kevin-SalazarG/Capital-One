import { Body, Controller, Get, Inject, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Public } from "../../common/auth/public.decorator";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { IdentityAuthService } from "./auth.service";
import { SignInDto } from "./dto/sign-in.dto";
import { SignUpDto } from "./dto/sign-up.dto";

@Controller("auth")
export class AuthController {
  public constructor(
    @Inject(IdentityAuthService)
    private readonly authService: IdentityAuthService,
  ) {}

  @Post("sign-up")
  @Public()
  public signUp(
    @Body() body: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.signUp(body, response);
  }

  @Post("sign-in")
  @Public()
  public signIn(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.signIn(body, response);
  }

  @Post("refresh")
  @Public()
  public refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refresh(
      this.authService.readRefreshToken(request),
      response,
    );
  }

  @Post("sign-out")
  @Public()
  public signOut(@Res({ passthrough: true }) response: Response): {
    signedOut: true;
  } {
    this.authService.signOut(response);
    return { signedOut: true };
  }

  @Get("session")
  public session(@CurrentUser() user: AuthenticatedUser): {
    readonly user: AuthenticatedUser;
  } {
    return { user };
  }
}
