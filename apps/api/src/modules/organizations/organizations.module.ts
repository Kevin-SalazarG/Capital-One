import { Module } from "@nestjs/common";

import { ORGANIZATION_ACCESS_PORT } from "../../common/authorization/organization-access.port";
import { OrganizationAccessService } from "./organization-access.service";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsRepository } from "./organizations.repository";
import { OrganizationsService } from "./organizations.service";
import { MembersController } from "./members.controller";
import { MembersRepository } from "./members.repository";
import { MembersService } from "./members.service";

@Module({
  controllers: [OrganizationsController, MembersController],
  providers: [
    OrganizationsRepository,
    OrganizationsService,
    OrganizationAccessService,
    MembersRepository,
    MembersService,
    {
      provide: ORGANIZATION_ACCESS_PORT,
      useExisting: OrganizationAccessService,
    },
  ],
  exports: [ORGANIZATION_ACCESS_PORT, OrganizationsRepository],
})
export class OrganizationsModule {}
