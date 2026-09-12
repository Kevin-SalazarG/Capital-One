import { Module } from "@nestjs/common";

import { ConnectionsController } from "./connections.controller";
import { ConnectionsRepository } from "./connections.repository";
import { ConnectionsService } from "./connections.service";

@Module({
  controllers: [ConnectionsController],
  providers: [ConnectionsRepository, ConnectionsService],
  exports: [ConnectionsRepository],
})
export class ConnectionsModule {}
