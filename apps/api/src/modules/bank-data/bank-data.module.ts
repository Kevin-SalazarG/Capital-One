import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ConnectionsModule } from "../connections/connections.module";
import { BankDataController } from "./bank-data.controller";
import { BankDataRepository } from "./bank-data.repository";
import { BankDataService } from "./bank-data.service";
import { BANK_PROVIDER_PORT } from "./domain/bank-provider.port";
import {
  NESSIE_CLIENT,
  createNessieClient,
} from "./infrastructure/nessie-client.provider";
import { NessieBankProvider } from "./infrastructure/nessie-bank.provider";
import { SyncBankDataUseCase } from "./sync-bank-data.use-case";

@Module({
  imports: [ConnectionsModule],
  controllers: [BankDataController],
  providers: [
    {
      provide: NESSIE_CLIENT,
      useFactory: createNessieClient,
      inject: [ConfigService],
    },
    NessieBankProvider,
    {
      provide: BANK_PROVIDER_PORT,
      useExisting: NessieBankProvider,
    },
    BankDataRepository,
    SyncBankDataUseCase,
    BankDataService,
  ],
  exports: [BankDataRepository],
})
export class BankDataModule {}
