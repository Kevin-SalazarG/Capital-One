import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BusinessesModule } from "../businesses/businesses.module.js";
import { CommitmentsModule } from "../commitments/commitments.module.js";
import { DecisionsModule } from "../decisions/decisions.module.js";
import { PlanningModule } from "../planning/planning.module.js";
import { DashboardController } from "./dashboard.controller.js";
import { DashboardService } from "./dashboard.service.js";

@Module({
  imports: [AuthModule, BusinessesModule, CommitmentsModule, DecisionsModule, PlanningModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
