import { IsUUID } from "class-validator";

export class RunBankSyncDto {
  @IsUUID()
  public connectionId!: string;
}
