import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateConnectionDto {
  @IsIn(["bank", "cfdi"])
  public readonly kind!: "bank" | "cfdi";

  @IsIn(["nessie", "synthetic_cfdi"])
  public readonly provider!: "nessie" | "synthetic_cfdi";

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  public readonly displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  public readonly externalCustomerId?: string;
}
