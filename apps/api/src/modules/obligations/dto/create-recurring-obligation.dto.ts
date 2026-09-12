import {
  IsIn,
  IsBoolean,
  Matches,
  MaxLength,
  MinLength,
  IsString,
} from "class-validator";

export class CreateRecurringObligationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  public readonly name!: string;

  @Matches(/^\d+(\.\d{1,2})?$/)
  public readonly amount!: string;

  @IsIn(["weekly", "biweekly", "monthly", "quarterly", "yearly"])
  public readonly frequency!:
    "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

  @IsIn(["payroll", "tax", "rent", "supplier", "other"])
  public readonly category: "payroll" | "tax" | "rent" | "supplier" | "other" =
    "other";

  @IsBoolean()
  public readonly critical = false;

  @Matches(/^[A-Z]{3}$/)
  public readonly currency = "MXN";

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  public readonly nextDueOn!: string;
}
