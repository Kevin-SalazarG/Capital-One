import { Module } from "@nestjs/common";

import { ObligationsController } from "./obligations.controller";
import { ObligationsRepository } from "./obligations.repository";
import { ObligationsService } from "./obligations.service";

@Module({
  controllers: [ObligationsController],
  providers: [ObligationsRepository, ObligationsService],
  exports: [ObligationsRepository],
})
export class ObligationsModule {}
