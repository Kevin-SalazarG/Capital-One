import { Global, Module } from "@nestjs/common";

import { SupabaseModule } from "../database/supabase.module";
import { AuditService } from "./audit.service";

@Global()
@Module({
  imports: [SupabaseModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
