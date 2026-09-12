import { Controller, Get, HttpCode, HttpStatus, Inject } from "@nestjs/common";

import { Public } from "../../common/auth/public.decorator";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  public constructor(
    @Inject(HealthService) private readonly healthService: HealthService,
  ) {}

  @Get("live")
  @Public()
  public live() {
    return this.healthService.live();
  }

  @Get("ready")
  @Public()
  @HttpCode(HttpStatus.OK)
  public ready() {
    return this.healthService.ready();
  }
}
