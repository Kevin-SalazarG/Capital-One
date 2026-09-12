import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsDateString,
  Matches,
} from "class-validator";
export class UpdateInvoicePlanningDto {
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  public readonly dueOn!: string;
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  public readonly earliestDate?: string | null;
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  public readonly latestDate?: string | null;
  @Matches(/^\d{1,12}(\.\d{1,2})?$/) public readonly negotiationCost!: string;
  @IsOptional()
  @Matches(/^\d{1,12}(\.\d{1,2})?$/)
  public readonly outstandingAmount?: string;
  @IsBoolean() public readonly critical!: boolean;
  @IsIn(["payroll", "tax", "rent", "supplier", "other"])
  public readonly category!: "payroll" | "tax" | "rent" | "supplier" | "other";
}
