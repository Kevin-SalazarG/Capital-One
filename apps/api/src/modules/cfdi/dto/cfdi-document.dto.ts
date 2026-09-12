import {
  IsDateString,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CfdiDocumentDto {
  @IsString()
  @MinLength(8)
  @MaxLength(80)
  public readonly cfdiUuid!: string;

  @IsIn(["receivable", "payable"])
  public readonly direction!: "receivable" | "payable";

  @Matches(/^[A-Z0-9]{12,13}$/)
  public readonly issuerRfc!: string;

  @Matches(/^[A-Z0-9]{12,13}$/)
  public readonly receiverRfc!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  public readonly counterpartyName?: string;

  @IsDateString()
  public readonly issuedAt!: string;

  @IsOptional()
  @IsDateString()
  public readonly dueOn?: string;

  @Matches(/^\d+(\.\d{1,2})?$/)
  public readonly totalAmount!: string;

  @Matches(/^\d+(\.\d{1,2})?$/)
  public readonly outstandingAmount!: string;

  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  public readonly currency?: string;

  @IsIn(["pending", "partial", "paid", "overdue", "cancelled"])
  public readonly paymentStatus!:
    "pending" | "partial" | "paid" | "overdue" | "cancelled";

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  public readonly expectedCollectionProbability?: number;

  @IsOptional()
  @IsObject()
  public readonly metadata?: Record<string, string | number | boolean | null>;
}
