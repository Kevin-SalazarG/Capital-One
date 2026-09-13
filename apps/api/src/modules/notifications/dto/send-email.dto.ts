import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class SendEmailDto {
  @IsEmail()
  @MaxLength(320)
  public readonly to!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public readonly subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(12000)
  public readonly text!: string;
}
