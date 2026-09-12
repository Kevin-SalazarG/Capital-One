import { IsString, Length, MaxLength, MinLength } from "class-validator";
export class ChooseTreasuryPlanDto {
  @IsString() @Length(64, 64) public readonly inputHash!: string;
  @IsString() @MinLength(1) @MaxLength(1000) public readonly planId!: string;
}
