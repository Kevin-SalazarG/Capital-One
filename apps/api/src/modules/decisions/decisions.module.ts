import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BusinessesModule } from "../businesses/businesses.module.js";
import { CommitmentsModule } from "../commitments/commitments.module.js";
import { PlanningModule } from "../planning/planning.module.js";
import { DecisionsController } from "./decisions.controller.js";
import { DecisionsService } from "./decisions.service.js";

@Module({
  imports: [AuthModule, BusinessesModule, CommitmentsModule, PlanningModule],
  controllers: [DecisionsController],
  providers: [DecisionsService],
  exports: [DecisionsService],
})
export class DecisionsModule {}
