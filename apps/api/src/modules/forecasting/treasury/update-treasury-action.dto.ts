import { IsString, IsIn, MaxLength, MinLength } from "class-validator";
export class UpdateTreasuryActionDto {
  @IsString() @MinLength(1) @MaxLength(500) public readonly actionId!: string;
  @IsIn(["pending", "contacted", "agreed"]) public readonly status!:
    "pending" | "contacted" | "agreed";
}
