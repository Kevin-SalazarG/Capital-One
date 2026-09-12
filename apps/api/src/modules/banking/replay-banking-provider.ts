import {
  type BankingLoadRequest,
  BankingProvider,
  BankingProviderError,
  type BankingSnapshot,
} from "./banking-provider.js";
import { validateProviderDate } from "./normalize-banking-data.js";

export class ReplayBankingProvider extends BankingProvider {
  constructor(private readonly snapshot: BankingSnapshot) {
    super();
    if (snapshot.source !== "replay" || snapshot.consistency !== "synthetic_fixture") {
      throw new BankingProviderError("PROVIDER_INVALID_DATA");
    }
  }

  override async load(request: BankingLoadRequest): Promise<BankingSnapshot> {
    if (request.signal?.aborted) throw new BankingProviderError("PROVIDER_CANCELLED");
    if (
      request.accountId !== this.snapshot.account.externalId ||
      request.customerId !== this.snapshot.account.customerId
    ) {
      throw new BankingProviderError("PROVIDER_SCOPE_MISMATCH");
    }
    if (validateProviderDate(request.cutoffDate) !== this.snapshot.cutoffDate) {
      throw new BankingProviderError("PROVIDER_INCONSISTENT_SNAPSHOT");
    }
    return structuredClone(this.snapshot);
  }
}
