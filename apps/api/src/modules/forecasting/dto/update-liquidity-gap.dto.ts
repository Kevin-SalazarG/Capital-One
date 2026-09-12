import { IsIn } from "class-validator";

export class UpdateLiquidityGapDto {
  @IsIn(["open", "resolved", "ignored"])
  public readonly status!: "open" | "resolved" | "ignored";
}
