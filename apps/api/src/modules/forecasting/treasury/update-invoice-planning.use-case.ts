import { Inject, Injectable } from "@nestjs/common";
import Decimal from "decimal.js";
import { AppError } from "../../../common/errors/app-error";
import type {
  TreasuryRepository,
  TreasuryContext,
  InvoicePlanningInput,
} from "./treasury-repository.port";
import { TREASURY_REPOSITORY } from "./treasury-repository.token";
@Injectable()
export class UpdateInvoicePlanningUseCase {
  public constructor(
    @Inject(TREASURY_REPOSITORY)
    private readonly repository: TreasuryRepository,
  ) {}
  public async execute(
    context: TreasuryContext,
    id: string,
    input: InvoicePlanningInput,
  ): Promise<{ readonly id: string }> {
    const row = await this.repository.findInvoice(context, id);
    if (
      (input.earliestDate &&
        (row.direction !== "receivable" ||
          input.earliestDate >= input.dueOn)) ||
      (input.latestDate &&
        (row.direction !== "payable" || input.latestDate <= input.dueOn)) ||
      (input.outstandingAmount !== undefined &&
        new Decimal(input.outstandingAmount).gt(row.totalAmount))
    )
      throw new AppError("Invalid invoice dates or outstanding amount", {
        code: "VALIDATION_ERROR",
        status: 400,
      });
    return this.repository.updateInvoice(context, row, input);
  }
}
