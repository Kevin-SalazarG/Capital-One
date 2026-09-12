import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthGuard } from "./auth-guard.js";
import { AuthProvider } from "./auth-provider.js";
import { SupabaseAuthProvider } from "./supabase-auth-provider.js";

@Module({
  controllers: [AuthController],
  providers: [AuthGuard, { provide: AuthProvider, useClass: SupabaseAuthProvider }],
  exports: [AuthProvider, AuthGuard],
})
export class AuthModule {}
