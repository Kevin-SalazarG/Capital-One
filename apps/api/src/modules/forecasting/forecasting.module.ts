import { Module } from "@nestjs/common";

import { BankDataModule } from "../bank-data/bank-data.module";
import { CfdiModule } from "../cfdi/cfdi.module";
import { ObligationsModule } from "../obligations/obligations.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { ForecastingController } from "./forecasting.controller";
import { ForecastInputReader } from "./forecast-input.reader";
import { ForecastRepository } from "./forecast.repository";
import { ForecastingService } from "./forecasting.service";
import { GenerateForecastUseCase } from "./generate-forecast.use-case";
import { ForecastEngine } from "./domain/forecast-engine";

@Module({
  imports: [BankDataModule, CfdiModule, ObligationsModule, OrganizationsModule],
  controllers: [ForecastingController],
  providers: [
    ForecastEngine,
    ForecastInputReader,
    ForecastRepository,
    GenerateForecastUseCase,
    ForecastingService,
  ],
  exports: [ForecastRepository, ForecastingService],
})
export class ForecastingModule {}
