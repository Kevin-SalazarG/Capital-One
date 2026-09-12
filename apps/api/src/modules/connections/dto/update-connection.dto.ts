import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateConnectionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  public readonly displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  public readonly externalCustomerId?: string;
}
