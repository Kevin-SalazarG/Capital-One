import { Inject, Injectable } from "@nestjs/common";
import type { TreasuryDecision } from "@colchon/treasury/treasury-contract";
import { AppError } from "../../../common/errors/app-error";
import type {
  TreasuryRepository,
  TreasuryContext,
} from "./treasury-repository.port";
import { TREASURY_REPOSITORY } from "./treasury-repository.token";
import type { UpdateTreasuryActionDto } from "./update-treasury-action.dto";
@Injectable()
export class UpdateTreasuryActionUseCase {
  public constructor(
    @Inject(TREASURY_REPOSITORY)
    private readonly repository: TreasuryRepository,
  ) {}
  public async execute(
    context: TreasuryContext,
    id: string,
    input: UpdateTreasuryActionDto,
  ): Promise<TreasuryDecision> {
    const snapshot = await this.repository.find(context, id);
    if (
      !snapshot.decision.plan.actions.some(
        (action) => action.id === input.actionId,
      )
    )
      throw new AppError("Action not in this plan", {
        code: "VALIDATION_FAILED",
        status: 400,
      });
    return this.repository.updateSteps(context, snapshot, {
      ...snapshot.decision.steps,
      [input.actionId]: input.status,
    });
  }
}
