import { Inject, Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app-error";
import { sha256 } from "../../common/utilities/stable-hash";
import { ForecastInputReader } from "./forecast-input.reader";
import { forecastInputSnapshot, forecastOutputView } from "./forecast.mapper";
import { ForecastRepository } from "./forecast.repository";
import { ForecastEngine } from "./domain/forecast-engine";

@Injectable()
export class GenerateForecastUseCase {
  public constructor(
    @Inject(ForecastInputReader) private readonly reader: ForecastInputReader,
    @Inject(ForecastRepository) private readonly repository: ForecastRepository,
    @Inject(ForecastEngine) private readonly engine: ForecastEngine,
  ) {}

  public async execute(
    organizationId: string,
    accessToken: string,
    horizonDays: number,
  ) {
    const { input } = await this.reader.read(
      organizationId,
      accessToken,
      horizonDays,
    );
    const inputHash = sha256(forecastInputSnapshot(input));
    const run = await this.repository.createRun(
      organizationId,
      accessToken,
      input,
      inputHash,
    );

    try {
      const output = this.engine.calculate(input);
      const persisted = await this.repository.completeRun(
        organizationId,
        accessToken,
        run.id,
        output,
      );
      return {
        run,
        output: forecastOutputView(output),
        persisted,
      };
    } catch (error) {
      await this.repository.markFailed(
        organizationId,
        accessToken,
        run.id,
        error instanceof AppError ? error.code : "FORECAST_FAILED",
        error instanceof Error ? error.message : "Forecast calculation failed",
      );
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Forecast calculation failed", {
        code: "FORECAST_FAILED",
        status: 500,
        cause: error,
      });
    }
  }
}
