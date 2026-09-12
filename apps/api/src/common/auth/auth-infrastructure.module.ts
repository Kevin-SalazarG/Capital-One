import { Module } from "@nestjs/common";

import { SupabaseModule } from "../database/supabase.module";
import { SupabaseAuthService } from "./supabase-auth.service";
import { SupabaseJwtGuard } from "./supabase-jwt.guard";

@Module({
  imports: [SupabaseModule],
  providers: [SupabaseAuthService, SupabaseJwtGuard],
  exports: [SupabaseAuthService, SupabaseJwtGuard],
})
export class AuthInfrastructureModule {}
