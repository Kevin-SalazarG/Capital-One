import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { AppEnvironment } from "../../config/app-config";
import { SupabaseService } from "../../common/database/supabase.service";

@Injectable()
export class HealthService {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
    @Inject(ConfigService)
    private readonly config: ConfigService<AppEnvironment>,
  ) {}

  public live() {
    return {
      status: "ok" as const,
      service: "colchon-api",
      version: "0.1.0",
    };
  }

  public async ready() {
    const startedAt = Date.now();
    const { error } = await this.supabase.adminClient
      .from("organizations")
      .select("id")
      .limit(1);
    return {
      status: error ? ("degraded" as const) : ("ok" as const),
      service: "colchon-api",
      environment: this.config.getOrThrow<string>("NODE_ENV"),
      database: error ? "unavailable" : "available",
      latencyMs: Date.now() - startedAt,
    };
  }
}
