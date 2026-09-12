import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BudgetsService } from "./budgets.service.js";
import { CommitmentsController } from "./commitments.controller.js";
import { CommitmentsService } from "./commitments.service.js";

@Module({
  imports: [AuthModule],
  controllers: [CommitmentsController],
  providers: [CommitmentsService, BudgetsService],
  exports: [CommitmentsService, BudgetsService],
})
export class CommitmentsModule {}
