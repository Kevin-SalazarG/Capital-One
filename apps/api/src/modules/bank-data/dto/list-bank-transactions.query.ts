import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, Max, Min } from "class-validator";

export class ListBankTransactionsQuery {
  @IsOptional()
  @IsDateString()
  public readonly from?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  public readonly limit = 200;
}
