import { IsEmail, IsIn, MaxLength } from "class-validator";

export class InviteMemberDto {
  @IsEmail()
  @MaxLength(320)
  public readonly email!: string;

  @IsIn(["admin", "analyst", "viewer"])
  public readonly role!: "admin" | "analyst" | "viewer";
}
