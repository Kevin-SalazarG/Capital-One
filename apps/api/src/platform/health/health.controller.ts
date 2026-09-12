import { Controller, Get, Inject, SerializeOptions } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import * as v from "valibot";
import { DatabaseService } from "../database/database.service.js";
import { ApiError } from "../http/api-error.js";

export const healthSchema = v.object({ status: v.literal("ok") });
export type HealthResult = v.InferOutput<typeof healthSchema>;

@Controller("health")
export class HealthController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  @Get("live")
  @ApiOperation({ operationId: "liveness" })
  @ApiResponse({ status: 200, standardSchema: healthSchema })
  @SerializeOptions({ schema: healthSchema })
  live(): HealthResult {
    return { status: "ok" };
  }
  @Get("ready")
  @ApiOperation({ operationId: "readiness" })
  @ApiResponse({ status: 200, standardSchema: healthSchema })
  @SerializeOptions({ schema: healthSchema })
  async ready(): Promise<HealthResult> {
    if (!(await this.database.ready()))
      throw new ApiError("DEPENDENCY_UNAVAILABLE", "Servicio temporalmente no disponible.", 503);
    return { status: "ok" };
  }
}
