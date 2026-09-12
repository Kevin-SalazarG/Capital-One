import { IsIn, Matches, MaxLength, MinLength, IsString } from "class-validator";

export class CreateRecurringObligationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  public readonly name!: string;

  @Matches(/^\d+(\.\d{1,2})?$/)
  public readonly amount!: string;

  @IsIn(["weekly", "monthly", "quarterly", "yearly"])
  public readonly frequency!: "weekly" | "monthly" | "quarterly" | "yearly";

  @Matches(/^[A-Z]{3}$/)
  public readonly currency = "MXN";

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  public readonly nextDueOn!: string;
}
