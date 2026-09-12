import { IsOptional, IsString, MaxLength } from "class-validator";
export class PreviewTreasuryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public readonly delayedReceiptId?: string;
}
