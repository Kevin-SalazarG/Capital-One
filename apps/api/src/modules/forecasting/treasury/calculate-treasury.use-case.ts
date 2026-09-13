import { Inject, Injectable } from "@nestjs/common";
import { buildTreasury } from "@colchon/treasury/treasury-engine";
import type { Treasury } from "@colchon/treasury/treasury-contract";
import { sha256 } from "../../../common/utilities/stable-hash";
import { ForecastInputReader } from "../forecast-input.reader";
import { treasuryInput } from "../domain/treasury-input.mapper";
import type { TreasuryContext } from "./treasury-repository.port";
@Injectable()
export class CalculateTreasuryUseCase {
  public constructor(
    @Inject(ForecastInputReader) private readonly inputs: ForecastInputReader,
  ) {}
  public async execute(context: TreasuryContext): Promise<Treasury> {
    const { input } = await this.inputs.read(
      context.organizationId,
      context.accessToken,
      30,
    );
    const normalized = treasuryInput(input);
    return buildTreasury(
      normalized,
      sha256({ version: "treasury-v2", ...normalized }),
    );
  }
}
