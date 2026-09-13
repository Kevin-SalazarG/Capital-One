import { Inject, Injectable } from "@nestjs/common";
import type { TreasuryDecision } from "@colchon/treasury/treasury-contract";
import { AppError } from "../../../common/errors/app-error";
import { CalculateTreasuryUseCase } from "./calculate-treasury.use-case";
import type {
  TreasuryRepository,
  TreasuryContext,
} from "./treasury-repository.port";
import { TREASURY_REPOSITORY } from "./treasury-repository.token";
import type { ChooseTreasuryPlanDto } from "./choose-treasury-plan.dto";
@Injectable()
export class ChooseTreasuryPlanUseCase {
  public constructor(
    @Inject(CalculateTreasuryUseCase)
    private readonly calculate: CalculateTreasuryUseCase,
    @Inject(TREASURY_REPOSITORY)
    private readonly repository: TreasuryRepository,
  ) {}
  public async execute(
    context: TreasuryContext,
    userId: string,
    input: ChooseTreasuryPlanDto,
  ): Promise<TreasuryDecision> {
    const current = await this.calculate.execute(context);
    if (current.inputHash !== input.inputHash)
      throw new AppError("Inputs changed; refresh and compare again", {
        code: "PLAN_STALE",
        status: 409,
      });
    const plan = current.plans.find((item) => item.id === input.planId);
    if (!plan)
      throw new AppError("Plan unavailable", {
        code: "PLAN_UNAVAILABLE",
        status: 409,
      });
    return this.repository.save(context, userId, input.inputHash, plan);
  }
}
