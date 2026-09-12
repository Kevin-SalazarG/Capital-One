import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export class ListCfdiInvoicesQuery {
  @IsOptional()
  @IsIn(["receivable", "payable"])
  public readonly direction?: "receivable" | "payable";

  @IsOptional()
  @IsIn(["pending", "partial", "paid", "overdue", "cancelled"])
  public readonly paymentStatus?:
    "pending" | "partial" | "paid" | "overdue" | "cancelled";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  public readonly limit = 200;
}
