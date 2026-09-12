import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

import { CfdiDocumentDto } from "./cfdi-document.dto";

export class CreateCfdiImportDto {
  @IsString()
  @MaxLength(160)
  public readonly sourceName!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CfdiDocumentDto)
  public readonly documents!: CfdiDocumentDto[];
}
