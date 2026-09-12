import { Module } from "@nestjs/common";

import { CfdiController } from "./cfdi.controller";
import { CfdiRepository } from "./cfdi.repository";
import { CfdiService } from "./cfdi.service";
import { SyntheticCfdiProvider } from "./synthetic-cfdi.provider";

@Module({
  controllers: [CfdiController],
  providers: [CfdiRepository, CfdiService, SyntheticCfdiProvider],
  exports: [CfdiRepository, CfdiService],
})
export class CfdiModule {}
