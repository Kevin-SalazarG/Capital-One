import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BankingModule } from "../banking/banking.module.js";
import { BusinessesModule } from "../businesses/businesses.module.js";
import { CommitmentsModule } from "../commitments/commitments.module.js";
import { PlanningController } from "./planning.controller.js";
import { PlanningService } from "./planning.service.js";

@Module({
  imports: [AuthModule, BusinessesModule, CommitmentsModule, BankingModule],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
