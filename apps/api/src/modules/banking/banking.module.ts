import { Module } from "@nestjs/common";
import { NessieClient } from "nessie-node-sdk";
import { APP_CONFIG, type AppConfig } from "../../config/app-config.js";
import { AuthModule } from "../auth/auth.module.js";
import { CommitmentsModule } from "../commitments/commitments.module.js";
import { BankingProvider, BankingProviderError } from "./banking-provider.js";
import { BankingController } from "./banking.controller.js";
import { BankingService } from "./banking.service.js";
import { NessieBankingProvider } from "./nessie-banking-provider.js";
import { ReplayBankingProvider } from "./replay-banking-provider.js";
import { replayBankingSnapshot } from "./replay-snapshot.js";

export function createBankingProvider(config: AppConfig): BankingProvider {
  if (config.BANKING_MODE === "replay") return new ReplayBankingProvider(replayBankingSnapshot);
  if (!config.NESSIE_API_KEY || !config.NESSIE_CUSTOMER_ID || !config.NESSIE_ACCOUNT_ID) {
    throw new BankingProviderError("PROVIDER_NOT_VERIFIED");
  }
  return new NessieBankingProvider(
    new NessieClient({ apiKey: config.NESSIE_API_KEY, timeoutMs: 15_000, maxRetries: 1 }),
    {
      customerId: config.NESSIE_CUSTOMER_ID,
      accountId: config.NESSIE_ACCOUNT_ID,
      verifiedMajorMxnUnits: config.NESSIE_UNITS_VERIFIED === "true",
      timeoutMs: 15_000,
    },
  );
}

@Module({
  imports: [AuthModule, CommitmentsModule],
  controllers: [BankingController],
  providers: [
    BankingService,
    { provide: BankingProvider, useFactory: createBankingProvider, inject: [APP_CONFIG] },
  ],
  exports: [BankingService, BankingProvider],
})
export class BankingModule {}
