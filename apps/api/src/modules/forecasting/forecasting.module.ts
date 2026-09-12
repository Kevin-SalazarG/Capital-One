import { Module } from "@nestjs/common";

import { BankDataModule } from "../bank-data/bank-data.module";
import { ConnectionsModule } from "../connections/connections.module";
import { CfdiModule } from "../cfdi/cfdi.module";
import { ObligationsModule } from "../obligations/obligations.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { ForecastingController } from "./forecasting.controller";
import { ForecastInputReader } from "./forecast-input.reader";
import { ForecastRepository } from "./forecast.repository";
import { ForecastingService } from "./forecasting.service";
import { GenerateForecastUseCase } from "./generate-forecast.use-case";
import { ForecastEngine } from "./domain/forecast-engine";
import { CalculateTreasuryUseCase } from "./treasury/calculate-treasury.use-case";
import { GetTreasuryUseCase } from "./treasury/get-treasury.use-case";
import { ChooseTreasuryPlanUseCase } from "./treasury/choose-treasury-plan.use-case";
import { UpdateTreasuryActionUseCase } from "./treasury/update-treasury-action.use-case";
import { UpdateInvoicePlanningUseCase } from "./treasury/update-invoice-planning.use-case";
import { SupabaseTreasuryRepository } from "./treasury/supabase-treasury.repository";
import { TREASURY_REPOSITORY } from "./treasury/treasury-repository.token";
import { TreasuryController } from "./treasury.controller";

@Module({
  imports: [
    BankDataModule,
    CfdiModule,
    ObligationsModule,
    OrganizationsModule,
    ConnectionsModule,
  ],
  controllers: [ForecastingController, TreasuryController],
  providers: [
    CalculateTreasuryUseCase,
    GetTreasuryUseCase,
    ChooseTreasuryPlanUseCase,
    UpdateTreasuryActionUseCase,
    UpdateInvoicePlanningUseCase,
    { provide: TREASURY_REPOSITORY, useClass: SupabaseTreasuryRepository },
    ForecastEngine,
    ForecastInputReader,
    ForecastRepository,
    GenerateForecastUseCase,
    ForecastingService,
  ],
  exports: [ForecastRepository, ForecastingService],
})
export class ForecastingModule {}
