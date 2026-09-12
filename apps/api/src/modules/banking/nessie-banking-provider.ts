import {
  NessieAbortError,
  type NessieClient,
  NessieResponseError,
  NessieTimeoutError,
  NessieValidationError,
  type RequestOptions,
} from "nessie-node-sdk";
import {
  type BankingLoadRequest,
  BankingProvider,
  BankingProviderError,
  type BankingSnapshot,
} from "./banking-provider.js";
import {
  BANKING_RECORD_LIMIT,
  bankingCalendarDate,
  normalizeAccount,
  normalizeBills,
  normalizeMovements,
  validateProviderDate,
} from "./normalize-banking-data.js";

export interface NessieBankingConfiguration {
  readonly customerId: string;
  readonly accountId: string;
  readonly verifiedMajorMxnUnits: boolean;
  readonly timeoutMs: number;
}

export class NessieBankingProvider extends BankingProvider {
  constructor(
    private readonly client: NessieClient,
    private readonly configuration: NessieBankingConfiguration,
    private readonly now: () => Date = () => new Date(),
  ) {
    super();
    if (
      !Number.isInteger(configuration.timeoutMs) ||
      configuration.timeoutMs < 1 ||
      configuration.timeoutMs > 15_000
    ) {
      throw new BankingProviderError("PROVIDER_INPUT_LIMIT");
    }
  }

  override async load(request: BankingLoadRequest): Promise<BankingSnapshot> {
    if (!this.configuration.verifiedMajorMxnUnits) {
      throw new BankingProviderError("PROVIDER_NOT_VERIFIED");
    }
    if (
      request.accountId !== this.configuration.accountId ||
      request.customerId !== this.configuration.customerId
    ) {
      throw new BankingProviderError("PROVIDER_SCOPE_MISMATCH");
    }
    const cutoffDate = validateProviderDate(request.cutoffDate);
    if (request.signal?.aborted) throw new BankingProviderError("PROVIDER_CANCELLED");
    const startedAt = this.now().toISOString();
    if (bankingCalendarDate(new Date(startedAt), request.timezone) !== cutoffDate) {
      throw new BankingProviderError("PROVIDER_INCONSISTENT_SNAPSHOT");
    }
    const cancellation = new AbortController();
    const timer = setTimeout(() => cancellation.abort(), this.configuration.timeoutMs);
    const signal = request.signal
      ? AbortSignal.any([request.signal, cancellation.signal])
      : cancellation.signal;
    const options: RequestOptions = {
      signal,
      timeoutMs: this.configuration.timeoutMs,
      maxRetries: 1,
    };
    try {
      const initialAccount = await this.client.accounts.get(request.accountId, options);
      if (
        initialAccount._id !== request.accountId ||
        initialAccount.customer_id !== request.customerId
      ) {
        throw new BankingProviderError("PROVIDER_SCOPE_MISMATCH");
      }
      const [deposits, withdrawals, bills] = await Promise.all([
        this.client.deposits.listByAccount(request.accountId, options),
        this.client.withdrawals.listByAccount(request.accountId, options),
        this.client.bills.listByAccount(request.accountId, options),
      ]);
      if (deposits.length + withdrawals.length + bills.length > BANKING_RECORD_LIMIT) {
        throw new BankingProviderError("PROVIDER_INPUT_LIMIT");
      }
      const finalAccount = await this.client.accounts.get(request.accountId, options);
      const account = normalizeAccount(initialAccount);
      if (JSON.stringify(account) !== JSON.stringify(normalizeAccount(finalAccount))) {
        throw new BankingProviderError("PROVIDER_INCONSISTENT_SNAPSHOT");
      }
      const completedAt = this.now().toISOString();
      if (bankingCalendarDate(new Date(completedAt), request.timezone) !== cutoffDate) {
        throw new BankingProviderError("PROVIDER_INCONSISTENT_SNAPSHOT");
      }
      return {
        source: "nessie_live",
        account,
        movements: normalizeMovements(deposits, withdrawals, request.accountId),
        bills: normalizeBills(bills, request.accountId),
        startedAt,
        completedAt,
        cutoffDate,
        consistency: "stable_balance_bracket",
        warnings: ["Nessie endpoint reads are not an atomic provider snapshot."],
      };
    } catch (error: unknown) {
      if (error instanceof BankingProviderError) throw error;
      if (request.signal?.aborted) throw new BankingProviderError("PROVIDER_CANCELLED");
      if (cancellation.signal.aborted || error instanceof NessieTimeoutError) {
        throw new BankingProviderError("PROVIDER_TIMEOUT");
      }
      if (error instanceof NessieAbortError) throw new BankingProviderError("PROVIDER_CANCELLED");
      if (error instanceof NessieResponseError || error instanceof NessieValidationError) {
        throw new BankingProviderError("PROVIDER_INVALID_DATA");
      }
      throw new BankingProviderError("PROVIDER_UNAVAILABLE");
    } finally {
      clearTimeout(timer);
      cancellation.abort();
    }
  }
}
