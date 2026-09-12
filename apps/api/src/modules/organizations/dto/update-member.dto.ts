import { IsIn } from "class-validator";

export class UpdateMemberDto {
  @IsIn(["admin", "analyst", "viewer"])
  public readonly role!: "admin" | "analyst" | "viewer";
}
