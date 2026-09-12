import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import type { AppConfig } from "./config/app-config.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { BankingModule } from "./modules/banking/banking.module.js";
import { BusinessesModule } from "./modules/businesses/businesses.module.js";
import { CommitmentsModule } from "./modules/commitments/commitments.module.js";
import { PlanningModule } from "./modules/planning/planning.module.js";
import { DecisionsModule } from "./modules/decisions/decisions.module.js";
import { DashboardModule } from "./modules/dashboard/dashboard.module.js";
import { HealthController } from "./platform/health/health.controller.js";
import { configurePlatformModule } from "./platform/platform.module.js";

@Module({})
export class AppModule {}

export function configureAppModule(config: AppConfig): DynamicModule {
  return {
    module: AppModule,
    imports: [
      configurePlatformModule(config),
      AuthModule,
      BusinessesModule,
      CommitmentsModule,
      BankingModule,
      PlanningModule,
      DecisionsModule,
      DashboardModule,
    ],
    controllers: [HealthController],
  };
}
