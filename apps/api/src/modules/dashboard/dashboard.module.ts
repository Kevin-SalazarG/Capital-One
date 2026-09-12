import { Module } from "@nestjs/common";

import { BankDataModule } from "../bank-data/bank-data.module";
import { ConnectionsModule } from "../connections/connections.module";
import { ForecastingModule } from "../forecasting/forecasting.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [
    BankDataModule,
    ConnectionsModule,
    ForecastingModule,
    OrganizationsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
