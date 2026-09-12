import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  public readonly name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  public readonly legalName?: string;

  @IsOptional()
  @Matches(/^[A-Z0-9]{12,13}$/)
  public readonly rfc?: string;

  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  public readonly currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  public readonly timeZone?: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  public readonly minimumCashReserve?: string;
}
