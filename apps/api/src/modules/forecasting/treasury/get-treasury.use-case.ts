import { Inject, Injectable } from "@nestjs/common";
import Decimal from "decimal.js";
import { buildTreasury, delayReceipt } from "@colchon/treasury/treasury-engine";
import type { Treasury } from "@colchon/treasury/treasury-contract";
import { AppError } from "../../../common/errors/app-error";
import { sha256 } from "../../../common/utilities/stable-hash";
import { CalculateTreasuryUseCase } from "./calculate-treasury.use-case";
import type {
  TreasuryRepository,
  TreasuryContext,
} from "./treasury-repository.port";
import { TREASURY_REPOSITORY } from "./treasury-repository.token";
@Injectable()
export class GetTreasuryUseCase {
  public constructor(
    @Inject(CalculateTreasuryUseCase)
    private readonly calculate: CalculateTreasuryUseCase,
    @Inject(TREASURY_REPOSITORY)
    private readonly repository: TreasuryRepository,
  ) {}
  public async execute(
    context: TreasuryContext,
    delayedReceiptId?: string,
  ): Promise<Treasury> {
    const [result, decision] = await Promise.all([
      this.calculate.execute(context),
      this.repository.latest(context),
    ]);
    if (delayedReceiptId) {
      if (
        !result.input.events.some(
          (event) =>
            event.id === delayedReceiptId && new Decimal(event.amount).gt(0),
        )
      )
        throw new AppError("Unknown receipt", {
          code: "VALIDATION_FAILED",
          status: 400,
        });
      return buildTreasury(
        delayReceipt(result.input, delayedReceiptId),
        sha256({ inputHash: result.inputHash, delayedReceiptId, delayDays: 7 }),
      );
    }
    return { ...result, decision };
  }
}
