import { Controller, Get, Inject } from "@nestjs/common";

import {
  AccessToken,
  CurrentUser,
} from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { MeService } from "./me.service";

@Controller("me")
export class MeController {
  public constructor(
    @Inject(MeService) private readonly meService: MeService,
  ) {}

  @Get()
  public get(
    @CurrentUser() user: AuthenticatedUser,
    @AccessToken() accessToken: string,
  ) {
    return this.meService.get(user, accessToken);
  }
}
