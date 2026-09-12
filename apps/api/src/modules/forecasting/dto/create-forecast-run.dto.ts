import { IsInt, IsOptional, Max, Min } from "class-validator";

export class CreateForecastRunDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  public readonly horizonDays = 30;
}
